/**
 * Puerto de Dominio para el servicio de hashing criptográfico.
 * Permite abstraer la lógica de contraseñas de librerías de infraestructura como bcrypt.
 */
export interface PasswordHasher {
    /**
     * Genera un hash seguro a partir de una contraseña en texto plano.
     */
    hash(password: string): Promise<string>;
  
    /**
     * Compara una contraseña en texto plano con un hash almacenado para verificar la credencial.
     */
    compare(plainText: string, hash: string): Promise<boolean>;
  }