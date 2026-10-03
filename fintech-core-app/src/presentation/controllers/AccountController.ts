import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { GetUserAccountsUseCase } from '../../use-cases/GetUserAccountsUseCase';
import { CreateAccountUseCase } from '../../use-cases/CreateAccountUseCase';
import { GetBalanceUseCase } from '../../use-cases/GetBalanceUseCase';
import { FreezeAccountUseCase } from '../../use-cases/FreezeAccountUseCase';
import { UnfreezeAccountUseCase } from '../../use-cases/UnfreezeAccountUseCase';

export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly getUserAccountsUseCase: GetUserAccountsUseCase,
    private readonly getBalanceUseCase?: GetBalanceUseCase,
    private readonly freezeAccountUseCase?: FreezeAccountUseCase,
    private readonly unfreezeAccountUseCase?: UnfreezeAccountUseCase
  ) {}

  createAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const newAccount = await this.createAccountUseCase.execute({ userId });

      res.status(201).json({
        status: 'success',
        data: newAccount,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserAccounts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extrae el ID del usuario directamente desde la sesión autenticada en el token
      const userId = req.user!.userId;
      const accounts = await this.getUserAccountsUseCase.execute({ userId });

      res.status(200).json({
        status: 'success',
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  };

  getBalance = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawAccountId = req.params.accountId;
      const accountId = Array.isArray(rawAccountId) ? rawAccountId[0] : rawAccountId;
      if (!accountId) {
        res.status(400).json({ status: 'fail', code: 'INVALID_PARAMETER', message: 'El parámetro accountId es requerido.' });
        return;
      }
      if (!this.getBalanceUseCase) {
        throw new Error('GetBalanceUseCase not configured.');
      }
      const account = await this.getBalanceUseCase.execute({ accountId });

      res.status(200).json({
        status: 'success',
        data: account,
      });
    } catch (error) {
      next(error);
    }
  };

  freeze = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawAccountId = req.params.accountId;
      const accountId = Array.isArray(rawAccountId) ? rawAccountId[0] : rawAccountId;
      if (!accountId) {
        res.status(400).json({ status: 'fail', code: 'INVALID_PARAMETER', message: 'El parámetro accountId es requerido.' });
        return;
      }
      if (!this.freezeAccountUseCase) {
        throw new Error('FreezeAccountUseCase not configured.');
      }
      await this.freezeAccountUseCase.execute(accountId);

      res.status(200).json({
        status: 'success',
        message: 'Cuenta congelada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  unfreeze = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawAccountId = req.params.accountId;
      const accountId = Array.isArray(rawAccountId) ? rawAccountId[0] : rawAccountId;
      if (!accountId) {
        res.status(400).json({ status: 'fail', code: 'INVALID_PARAMETER', message: 'El parámetro accountId es requerido.' });
        return;
      }
      if (!this.unfreezeAccountUseCase) {
        throw new Error('UnfreezeAccountUseCase not configured.');
      }
      await this.unfreezeAccountUseCase.execute(accountId);

      res.status(200).json({
        status: 'success',
        message: 'Cuenta descongelada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };
}

