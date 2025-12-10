import { Request, Response } from "express";
import mercadopago from "./service"; // importando sua inst\u00e2ncia configurada
import { Preference } from "mercadopago";
import prisma from "../../config/dbConfig";

interface AuthenticatedRequest extends Request {
    user?: { email: string; cpf: string };
}

interface ItemCarrinho {
    id_produto: string;
    quantidade: number;
}

export const criarPagamento = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { pedido_id, itens } = req.body;
    const userEmail = req.user?.email;

    console.log("📦 Recebido no backend:", { pedido_id, itens, userEmail });

    if (!userEmail) {
        res.status(401).json({ error: "Usuário não autenticado." });
        return;
    }

    try {
        let mercadoPagoItems;

        // OPÇÃO 1: Se enviou pedido_id, buscar do banco
        if (pedido_id) {
            console.log("🔍 Buscando pedido no banco:", pedido_id);
            
            const pedido = await prisma.pedido.findUnique({
                where: { pedido_id: Number(pedido_id) },
                include: {
                    produtos_no_pedido: {
                        include: {
                            produto: true
                        }
                    }
                }
            });

            if (!pedido || !pedido.produtos_no_pedido || pedido.produtos_no_pedido.length === 0) {
                res.status(404).json({ error: "Pedido não encontrado ou sem produtos." });
                return;
            }

            console.log("✅ Pedido encontrado com", pedido.produtos_no_pedido.length, "produtos");

            // Criar items do Mercado Pago a partir do pedido
            mercadoPagoItems = pedido.produtos_no_pedido.map((item) => {
                const produto = item.produto;
                const preco = produto.is_promocao && produto.preco_promocao 
                    ? produto.preco_promocao 
                    : produto.preco;

                return {
                    id: produto.id_produto,
                    title: produto.nome,
                    description: produto.descricao,
                    picture_url: produto.image,
                    quantity: item.quantidade,
                    unit_price: Number(preco),
                    currency_id: "BRL",
                };
            });
        }
        // OPÇÃO 2: Se enviou itens diretamente (fallback)
        else if (itens && Array.isArray(itens) && itens.length > 0) {
            console.log("🔍 Buscando produtos pelos IDs:", itens.map((i: ItemCarrinho) => i.id_produto));
            
            const produtosIds = itens.map((item: ItemCarrinho) => item.id_produto);
            const produtos = await prisma.produto.findMany({
                where: { id_produto: { in: produtosIds } }
            });

            if (produtos.length === 0) {
                res.status(404).json({ error: "Nenhum produto encontrado." });
                return;
            }

            mercadoPagoItems = itens.map((item: ItemCarrinho) => {
                const produto = produtos.find(p => p.id_produto === item.id_produto);
                if (!produto) throw new Error(`Produto ${item.id_produto} não encontrado`);

                const preco = produto.is_promocao && produto.preco_promocao 
                    ? produto.preco_promocao 
                    : produto.preco;

                return {
                    id: produto.id_produto,
                    title: produto.nome,
                    description: produto.descricao,
                    picture_url: produto.image,
                    quantity: item.quantidade,
                    unit_price: Number(preco),
                    currency_id: "BRL",
                };
            });
        }
        // Nenhuma das opções foi fornecida
        else {
            res.status(400).json({ error: "É necessário enviar 'pedido_id' ou 'itens'." });
            return;
        }

        console.log("💰 Items do Mercado Pago:", mercadoPagoItems);

        const preferenceClient = new Preference(mercadopago);

        const external_reference = pedido_id ? `pedido-${pedido_id}` : `temp-${Date.now()}`;

        const preferenceBody: any = {
            external_reference,
            payer: { 
                email: userEmail 
            },
            items: mercadoPagoItems,
            back_urls: {
                success: `http://agriconnect.com.br/pagamento/sucesso?pedido_id=${pedido_id || ''}`,
                failure: `http://agriconnect.com.br/pagamento/falha?pedido_id=${pedido_id || ''}`,
                pending: `http://agriconnect.com.br/pagamento/pendente?pedido_id=${pedido_id || ''}`,
            },
        };

        console.log("📝 Preferência a ser enviada:", JSON.stringify(preferenceBody, null, 2));

        console.log("🚀 Criando preferência no Mercado Pago...");

        const createdPreference = await preferenceClient.create({ body: preferenceBody });

        if (!createdPreference.id) {
            throw new Error("Mercado Pago não retornou ID da preferência");
        }

        console.log("✅ Preferência criada:", createdPreference.id);

        res.json({
            preferenceId: createdPreference.id,
            initPoint: createdPreference.init_point,
        });

    } catch (err: any) {
        console.error("❌ Erro ao criar preferência:", err);

        if (err.response) {
            console.error("📄 Detalhes da resposta do Mercado Pago:", {
                status: err.response.status,
                data: err.response.data,
            });
        }

        res.status(500).json({ 
            error: "Erro ao criar preferência de pagamento",
            details: err.message 
        });
    }
};

export default criarPagamento;
