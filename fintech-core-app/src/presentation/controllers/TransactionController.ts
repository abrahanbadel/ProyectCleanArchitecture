import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { TransferFundsService } from '../../use-cases/TransferMoneyUseCase';
import { FundDepositService } from '../../use-cases/DepositUseCase';
import { CashWithdrawalService } from '../../use-cases/WithdrawalUseCase';
import { TransactionHistoryService } from '../../use-cases/GetTransactionHistoryUseCase';

export class TransactionController {
  constructor(
    private readonly transferService: TransferFundsService,
    private readonly depositService: FundDepositService,
    private readonly withdrawalService: CashWithdrawalService,
    private readonly historyService: TransactionHistoryService,
  ) {}

  processTransfer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.transferService.execute(req.body, req.user!.userId);

      res.status(201).json({
        status: 'success',
        message: 'Transferencia procesada correctamente',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  processDeposit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.depositService.execute(req.body, req.user!.userId);

      res.status(201).json({
        status: 'success',
        message: 'Depósito procesado correctamente',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  processWithdraw = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.withdrawalService.execute(req.body, req.user!.userId);

      res.status(201).json({
        status: 'success',
        message: 'Retiro procesado correctamente',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  processHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.params.accountId as string;
      const history = await this.historyService.execute({ accountId }, req.user!.userId);

      res.status(200).json({
        status: 'success',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };
}
