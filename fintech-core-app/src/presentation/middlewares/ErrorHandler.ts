import { Request, Response, NextFunction } from 'express';
import { Prisma } from '../../generated/prisma/client';
import { DomainError } from '../../domain/exceptions/DomainError';
import { InsufficientBalanceError, AccountNotFoundError } from '../../domain/exceptions/FinancialError';
import { InvalidCredentialsError, UserAlreadyExistsError } from '../../domain/exceptions/UserError';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Mapeo de Excepciones Específicas de Dominio
  if (err instanceof InsufficientBalanceError) {
    res.status(400).json({ status: 'fail', code: 'INSUFFICIENT_FUNDS', message: err.message });
    return;
  }

  if (err instanceof UserAlreadyExistsError) {
    res.status(409).json({ status: 'fail', code: 'USER_ALREADY_EXISTS', message: err.message });
    return;
  }

  if (err instanceof InvalidCredentialsError) {
    res.status(401).json({ status: 'fail', code: 'INVALID_CREDENTIALS', message: err.message });
    return;
  }

  if (err instanceof AccountNotFoundError) {
    res.status(404).json({ status: 'fail', code: 'ACCOUNT_NOT_FOUND', message: err.message });
    return;
  }

  if (err instanceof DomainError) {
    res.status(400).json({ status: 'fail', code: 'DOMAIN_VALIDATION_ERROR', message: err.message });
    return;
  }

  // 2. Mapeo de Excepciones Conocidas de Prisma (ORM / Base de Datos)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        status: 'fail',
        code: 'DUPLICATE_FIELD',
        message: 'Existe un conflicto con un dato único ya registrado en el sistema.',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        status: 'fail',
        code: 'RESOURCE_NOT_FOUND',
        message: 'El recurso solicitado no fue encontrado en la base de datos.',
      });
      return;
    }
  }

  // 3. Fallos Inesperados / Errores de Infraestructura no Controlados
  console.error('[UNHANDLED CRITICAL ERROR]:', err);

  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Ocurrió un error interno e inesperado en el servidor. Por favor intente más tarde.',
  });
};