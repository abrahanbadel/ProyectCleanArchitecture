import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { AccountCreationService } from '../../use-cases/CreateAccountUseCase';
import { AccountProviderService } from '../../use-cases/GetUserAccountsUseCase';
import { BalanceInquiryService } from '../../use-cases/GetBalanceUseCase';
import { AccountFreezeService } from '../../use-cases/FreezeAccountUseCase';
import { AccountReactivationService } from '../../use-cases/UnfreezeAccountUseCase';

export class AccountController {
  constructor(
    private readonly accountCreator: AccountCreationService,
    private readonly accountProvider: AccountProviderService,
    private readonly balanceProvider: BalanceInquiryService,
    private readonly freezeService: AccountFreezeService,
    private readonly unfreezeService: AccountReactivationService,
  ) {}

  processCreate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const account = await this.accountCreator.execute({ userId });

      res.status(201).json({
        status: 'success',
        data: account,
      });
    } catch (error) {
      next(error);
    }
  };

  processGetAccounts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const accounts = await this.accountProvider.execute({ userId });

      res.status(200).json({
        status: 'success',
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  };

  processGetBalance = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = this.requireAccountId(req, res);
      if (!accountId) return;

      const account = await this.balanceProvider.execute(
        { accountId },
        req.user!.userId,
      );

      res.status(200).json({
        status: 'success',
        data: account,
      });
    } catch (error) {
      next(error);
    }
  };

  processFreeze = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = this.requireAccountId(req, res);
      if (!accountId) return;

      await this.freezeService.execute(accountId, req.user!.userId);

      res.status(200).json({
        status: 'success',
        message: 'Cuenta congelada correctamente',
      });
    } catch (error) {
      next(error);
    }
  };

  processUnfreeze = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = this.requireAccountId(req, res);
      if (!accountId) return;

      await this.unfreezeService.execute(accountId, req.user!.userId);

      res.status(200).json({
        status: 'success',
        message: 'Cuenta descongelada correctamente',
      });
    } catch (error) {
      next(error);
    }
  };

  private requireAccountId(req: AuthenticatedRequest, res: Response): string | null {
    const rawId = req.params.accountId;
    const accountId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!accountId) {
      res.status(400).json({
        status: 'fail',
        code: 'INVALID_PARAMETER',
        message: 'accountId is required.',
      });
      return null;
    }
    return accountId;
  }
}
