import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { TransferMoneyUseCase } from '../../use-cases/TransferMoneyUseCase';
import { DepositUseCase } from '../../use-cases/DepositUseCase';
import { WithdrawalUseCase } from '../../use-cases/WithdrawalUseCase';
import { GetTransactionHistoryUseCase } from '../../use-cases/GetTransactionHistoryUseCase';

export class TransactionController {
  constructor(
    private readonly transferMoneyUseCase: TransferMoneyUseCase,
    private readonly depositUseCase: DepositUseCase,
    private readonly withdrawalUseCase: WithdrawalUseCase,
    private readonly getTransactionHistoryUseCase: GetTransactionHistoryUseCase
  ) {}

  transfer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.transferMoneyUseCase.execute(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Transferencia ejecutada de forma satisfactoria',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deposit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.depositUseCase.execute(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Depósito ejecutado de forma satisfactoria',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  withdraw = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.withdrawalUseCase.execute(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Retiro ejecutado de forma satisfactoria',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.params.accountId as string;
      const history = await this.getTransactionHistoryUseCase.execute({ accountId });

      res.status(200).json({
        status: 'success',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };
}
