/**
 * Estructura del contenido (payload) almacenado dentro del token JWT.
 */
export interface TokenPayload {
    userId: string;
    email: string;
  }
  
  /**
   * Puerto de Dominio para la generación y verificación de tokens de autenticación.
   */
  export interface TokenService {
    /**
     * Firma y genera un token JWT codificado con los claims provistos.
     */
    generateToken(payload: TokenPayload): string;
  
    /**
     * Verifica la validez y firma del token. Retorna el payload decodificado si es válido.
     */
    verifyToken(token: string): TokenPayload;
  }