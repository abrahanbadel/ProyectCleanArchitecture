import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../domain/services/TokenService';

/**
 * Extensión de la interfaz de Request de Express para incluir la identidad del usuario autenticado.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export class AuthMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  public handle = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    // 1. Validar presencia del encabezado Authorization con el prefijo 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'fail',
        code: 'UNAUTHORIZED',
        message: 'Acceso denegado. Se requiere un Bearer Token válido en la cabecera Authorization.',
      });
      return;
    }

    // 2. Extraer la cadena hash del token omitiendo el prefijo 'Bearer '
    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        status: 'fail',
        code: 'UNAUTHORIZED',
        message: 'Acceso denegado. Se requiere un Bearer Token válido en la cabecera Authorization.',
      });
      return;
    }

    try {
      // 3. Verificar el token usando el servicio desacoplado
      const payload = this.tokenService.verifyToken(token);
      
      // 4. Inyectar el payload del usuario autenticado en la petición
      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({
        status: 'fail',
        code: 'INVALID_TOKEN',
        message: 'El token de autenticación provisto es inválido o ha expirado.',
      });
      return;
    }
  };
}