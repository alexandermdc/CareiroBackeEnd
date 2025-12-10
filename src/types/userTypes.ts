/**
 * Tipos de usuário do sistema
 */
export enum TipoUsuario {
  ADMIN = '16030359-9f9e-43cf-97ac-946ab59ef5d4',
  VENDEDOR = 'fbb4dc63-57fb-439b-ae95-7ce5b7d19fbd',
  CLIENTE = 'a17c3a90-9a9d-4fb3-a148-f9b509076f76'
}

/**
 * UUIDs fixos para usuários padrão do sistema
 * Útil para referências diretas no código
 */
export enum UserUUIDs {
  admin = '16030359-9f9e-43cf-97ac-946ab59ef5d4', // Mesmo UUID do TipoUsuario.ADMIN
}

/**
 * CPFs fixos para usuários padrão
 */
export enum UserCPFs {
  admin = '00000000000',
}

/**
 * Emails fixos para usuários padrão
 */
export enum UserEmails {
  admin = 'admin@agriconect.com.br',
}

/**
 * Verifica se um usuário é admin pelo UUID
 */
export function isAdminUser(userId: string): boolean {
  return userId === UserUUIDs.admin;
}

/**
 * Verifica se um usuário é admin pelo email
 */
export function isAdminEmail(email: string): boolean {
  return email === UserEmails.admin;
}

/**
 * Verifica se um usuário é admin pelo CPF
 */
export function isAdminCPF(cpf: string): boolean {
  return cpf === UserCPFs.admin;
}
