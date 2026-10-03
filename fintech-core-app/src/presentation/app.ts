import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// Adapters de Infraestructura
import { BcryptPasswordHasher } from '../infrastructure/services/BcryptPasswordHasher';
import { JwtTokenService } from '../infrastructure/services/JwtTokenService';
import { PrismaUserRepository } from '../infrastructure/Repositories/PrismaUserRepository';
import { PrismaAccountRepository } from '../infrastructure/Repositories/PrismaAccountRepository';
import { PrismaTransactionRepository } from '../infrastructure/Repositories/PrismaTransactionRepository';

// Casos de Uso
import { RegisterUserUseCase } from '../use-cases/RegisterUserUseCase';
import { LoginUseCase } from '../use-cases/LoginUseCase';
import { CreateAccountUseCase } from '../use-cases/CreateAccountUseCase';
import { GetUserAccountsUseCase } from '../use-cases/GetUserAccountsUseCase';
import { GetBalanceUseCase } from '../use-cases/GetBalanceUseCase';
import { FreezeAccountUseCase } from '../use-cases/FreezeAccountUseCase';
import { UnfreezeAccountUseCase } from '../use-cases/UnfreezeAccountUseCase';
import { TransferMoneyUseCase } from '../use-cases/TransferMoneyUseCase';
import { DepositUseCase } from '../use-cases/DepositUseCase';
import { WithdrawalUseCase } from '../use-cases/WithdrawalUseCase';
import { GetTransactionHistoryUseCase } from '../use-cases/GetTransactionHistoryUseCase';

// Controllers & Middlewares
import { AuthController } from './controllers/AuthController';
import { AccountController } from './controllers/AccountController';
import { TransactionController } from './controllers/TransactionController';
import { AuthMiddleware } from './middlewares/AuthMiddleware';
import { validateRequest } from './middlewares/validateRequest';
import { errorHandler } from './middlewares/ErrorHandler';

// DTO Schemas
import { RegisterUserSchema, LoginSchema } from './dtos/AuthDTOs';
import { TransferMoneySchema, DepositMoneySchema, WithdrawalMoneySchema } from './dtos/TransactionDTOs';

export function createApp(): Application {
  const app = express();

  // Middlewares globales de Express
  app.use(cors());
  app.use(express.json());

  // 1. Instanciación de Base de datos (Capa de Infraestructura)
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });

  // 2. Instanciación de Servicios (Capa de Infraestructura)
  const passwordHasher = new BcryptPasswordHasher(10);
  const tokenService = new JwtTokenService();

  // 3. Instanciación de Repositorios (Capa de Infraestructura)
  const userRepository = new PrismaUserRepository(prisma);
  const accountRepository = new PrismaAccountRepository(prisma);
  const transactionRepository = new PrismaTransactionRepository(prisma);

  // 4. Instanciación de Casos de Uso (Capa de Aplicación)
  const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher, accountRepository);
  const loginUseCase = new LoginUseCase(userRepository, tokenService, passwordHasher);
  const createAccountUseCase = new CreateAccountUseCase(accountRepository);
  const getUserAccountsUseCase = new GetUserAccountsUseCase(accountRepository);
  const getBalanceUseCase = new GetBalanceUseCase(accountRepository);
  const freezeAccountUseCase = new FreezeAccountUseCase(accountRepository);
  const unfreezeAccountUseCase = new UnfreezeAccountUseCase(accountRepository);
  const transferMoneyUseCase = new TransferMoneyUseCase(accountRepository);
  const depositUseCase = new DepositUseCase(accountRepository);
  const withdrawalUseCase = new WithdrawalUseCase(accountRepository);
  const getTransactionHistoryUseCase = new GetTransactionHistoryUseCase(transactionRepository);

  // 5. Instanciación de Controladores y Guardias HTTP (Capa de Presentación)
  const authController = new AuthController(registerUserUseCase, loginUseCase);
  const accountController = new AccountController(
    createAccountUseCase,
    getUserAccountsUseCase,
    getBalanceUseCase,
    freezeAccountUseCase,
    unfreezeAccountUseCase
  );
  const transactionController = new TransactionController(
    transferMoneyUseCase,
    depositUseCase,
    withdrawalUseCase,
    getTransactionHistoryUseCase
  );
  const authMiddleware = new AuthMiddleware(tokenService);

  // 6. Definición y Enrutamiento de la API REST
  // --- Estado del Servidor & Bienvenida ---
  app.get('/', (_req, res) => {
    res.json({
      name: 'Fintech Core App API',
      status: 'online',
      version: '1.0.0',
      endpoints: {
        auth: ['POST /api/auth/register', 'POST /api/auth/login'],
        accounts: [
          'GET /api/accounts',
          'POST /api/accounts',
          'GET /api/accounts/:accountId/balance',
          'PATCH /api/accounts/:accountId/freeze',
          'PATCH /api/accounts/:accountId/unfreeze',
        ],
        transactions: [
          'POST /api/transactions/transfer',
          'POST /api/transactions/deposit',
          'POST /api/transactions/withdrawal',
          'GET /api/transactions/history/:accountId',
        ],
      },
    });
  });

  // --- Rutas Públicas (Autenticación) ---
  app.post('/api/auth/register', validateRequest(RegisterUserSchema), authController.register);
  app.post('/api/auth/login', validateRequest(LoginSchema), authController.login);

  // --- Rutas Protegidas (Cuentas) ---
  app.get('/api/accounts', authMiddleware.handle, accountController.getUserAccounts);
  app.post('/api/accounts', authMiddleware.handle, accountController.createAccount);
  app.get('/api/accounts/:accountId/balance', authMiddleware.handle, accountController.getBalance);
  app.patch('/api/accounts/:accountId/freeze', authMiddleware.handle, accountController.freeze);
  app.patch('/api/accounts/:accountId/unfreeze', authMiddleware.handle, accountController.unfreeze);

  // --- Rutas Protegidas (Transacciones) ---
  app.post('/api/transactions/transfer', authMiddleware.handle, validateRequest(TransferMoneySchema), transactionController.transfer);
  app.post('/api/transactions/deposit', authMiddleware.handle, validateRequest(DepositMoneySchema), transactionController.deposit);
  app.post('/api/transactions/withdrawal', authMiddleware.handle, validateRequest(WithdrawalMoneySchema), transactionController.withdraw);
  app.get('/api/transactions/history/:accountId', authMiddleware.handle, transactionController.getHistory);

  // 7. Middleware Global de Manejo de Errores (Obligatoriamente al final)
  app.use(errorHandler);

  return app;
}