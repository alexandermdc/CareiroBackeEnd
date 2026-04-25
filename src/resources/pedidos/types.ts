export interface ItemPedidoDTO {
	produto_id?: string;
	id_produto?: string;
	quantidade: number;
}

export interface CreatePedidoDTO {
	data_pedido?: string;
	fk_feira?: number;
	cpf_cliente?: string;
	forma_entrega?: string;
	fk_feira_retirada?: number | null;
	fk_associacao_retirada?: string | null;
	produtos: ItemPedidoDTO[];
}

export interface UpdatePedidoDTO {
	data_pedido?: string;
	fk_feira?: number;
	fk_feira_retirada?: number | null;
	fk_associacao_retirada?: string | null;
}
