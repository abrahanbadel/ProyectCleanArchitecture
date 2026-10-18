import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../domain/services/TokenService';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export class AuthMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  public verifyAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'fail',
        code: 'UNAUTHORIZED',
        message: 'Token de acceso faltante o formato incorrecto.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        status: 'fail',
        code: 'UNAUTHORIZED',
        message: 'Token no proporcionado.',
      });
      return;
    }

    try {
      const userData = this.tokenService.verifyToken(token);
      req.user = userData;
      next();
    } catch {
      res.status(401).json({
        status: 'fail',
        code: 'INVALID_TOKEN',
        message: 'El token ha expirado o no es válido.',
      });
    }
  };
}
