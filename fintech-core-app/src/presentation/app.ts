import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

import { BcryptPasswordHasher } from '../infrastructure/services/BcryptPasswordHasher';
import { JwtTokenService } from '../infrastructure/services/JwtTokenService';
import { SqlUserPersistence } from '../infrastructure/Repositories/PrismaUserRepository';
import { SqlBankAccountPersistence } from '../infrastructure/Repositories/PrismaAccountRepository';
import { SqlMovementPersistence } from '../infrastructure/Repositories/PrismaTransactionRepository';

import { UserRegistrationService } from '../use-cases/RegisterUserUseCase';
import { UserLoginService } from '../use-cases/LoginUseCase';
import { AccountCreationService } from '../use-cases/CreateAccountUseCase';
import { AccountProviderService } from '../use-cases/GetUserAccountsUseCase';
import { BalanceInquiryService } from '../use-cases/GetBalanceUseCase';
import { AccountFreezeService } from '../use-cases/FreezeAccountUseCase';
import { AccountReactivationService } from '../use-cases/UnfreezeAccountUseCase';
import { TransferFundsService } from '../use-cases/TransferMoneyUseCase';
import { FundDepositService } from '../use-cases/DepositUseCase';
import { CashWithdrawalService } from '../use-cases/WithdrawalUseCase';
import { TransactionHistoryService } from '../use-cases/GetTransactionHistoryUseCase';

import { AuthController } from './controllers/AuthController';
import { AccountController } from './controllers/AccountController';
import { TransactionController } from './controllers/TransactionController';
import { AuthMiddleware } from './middlewares/AuthMiddleware';
import { validateRequest } from './middlewares/validateRequest';
import { errorHandler } from './middlewares/ErrorHandler';

import { RegisterUserSchema, LoginSchema } from './dtos/AuthDTOs';
import { TransferMoneySchema, DepositMoneySchema, WithdrawalMoneySchema } from './dtos/TransactionDTOs';

export function createApp(): Application {
  const app = express();

  const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });

  const passwordHasher = new BcryptPasswordHasher(10);
  const tokenService = new JwtTokenService();

  const userRepo = new SqlUserPersistence(prisma);
  const bankRepo = new SqlBankAccountPersistence(prisma);
  const movementRepo = new SqlMovementPersistence(prisma);

  const registerUserSvc = new UserRegistrationService(userRepo, passwordHasher, bankRepo);
  const loginUserSvc = new UserLoginService(userRepo, tokenService, passwordHasher);
  const createAccountSvc = new AccountCreationService(bankRepo);
  const getAccountsSvc = new AccountProviderService(bankRepo);
  const getBalanceSvc = new BalanceInquiryService(bankRepo);
  const freezeSvc = new AccountFreezeService(bankRepo);
  const unfreezeSvc = new AccountReactivationService(bankRepo);
  const transferSvc = new TransferFundsService(bankRepo);
  const depositSvc = new FundDepositService(bankRepo);
  const withdrawalSvc = new CashWithdrawalService(bankRepo);
  const historySvc = new TransactionHistoryService(movementRepo, bankRepo);

  const authCtrl = new AuthController(registerUserSvc, loginUserSvc);
  const accountCtrl = new AccountController(
    createAccountSvc,
    getAccountsSvc,
    getBalanceSvc,
    freezeSvc,
    unfreezeSvc
  );
  const transactionCtrl = new TransactionController(
    transferSvc,
    depositSvc,
    withdrawalSvc,
    historySvc
  );
  const authGuard = new AuthMiddleware(tokenService);

  app.get('/', (_req, res) => {
    res.json({
      app: 'Fintech Core API',
      status: 'active',
      version: '1.0.0',
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.post('/api/auth/register', validateRequest(RegisterUserSchema), authCtrl.handleRegister);
  app.post('/api/auth/login', validateRequest(LoginSchema), authCtrl.handleLogin);

  app.get('/api/accounts', authGuard.verifyAuth, accountCtrl.processGetAccounts);
  app.post('/api/accounts', authGuard.verifyAuth, accountCtrl.processCreate);
  app.get('/api/accounts/:accountId/balance', authGuard.verifyAuth, accountCtrl.processGetBalance);
  app.patch('/api/accounts/:accountId/freeze', authGuard.verifyAuth, accountCtrl.processFreeze);
  app.patch('/api/accounts/:accountId/unfreeze', authGuard.verifyAuth, accountCtrl.processUnfreeze);

  app.post('/api/transactions/transfer', authGuard.verifyAuth, validateRequest(TransferMoneySchema), transactionCtrl.processTransfer);
  app.post('/api/transactions/deposit', authGuard.verifyAuth, validateRequest(DepositMoneySchema), transactionCtrl.processDeposit);
  app.post('/api/transactions/withdrawal', authGuard.verifyAuth, validateRequest(WithdrawalMoneySchema), transactionCtrl.processWithdraw);
  app.get('/api/transactions/history/:accountId', authGuard.verifyAuth, transactionCtrl.processHistory);

  app.use(errorHandler);

  return app;
}
