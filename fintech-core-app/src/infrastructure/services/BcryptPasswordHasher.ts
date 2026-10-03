import bcrypt from 'bcrypt';
import { PasswordHasher } from '../../domain/services/PasswordHasher';

/**
 * Adaptador de Infraestructura que implementa el servicio de hashing usando Bcrypt.
 */
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds: number;

  /**
   * @param saltRounds Factor de costo de Bcrypt (Work Factor). Valor recomendado por defecto: 10.
   */
  constructor(saltRounds: number = 10) {
    this.saltRounds = saltRounds;
  }

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hash);
  }
}