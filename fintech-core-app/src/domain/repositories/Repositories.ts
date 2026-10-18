import { User } from '../entities/User';
import { BankAccount } from '../entities/Account';
import { FinancialMovement } from '../entities/Transaction';

export interface UserPersistence {
  getById(id: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  searchByName(fullName: string): Promise<User[]>;
  upsert(user: User): Promise<User>;
}

export interface BankAccountPersistence {
  getById(id: string): Promise<BankAccount | null>;
  getByIban(iban: string): Promise<BankAccount | null>;
  getByOwner(userId: string): Promise<BankAccount[]>;
  save(account: BankAccount): Promise<void>;
  persist(account: BankAccount): Promise<void>;
  recordMovement(movement: FinancialMovement): Promise<FinancialMovement>;
}

export interface MovementPersistence {
  getById(id: string): Promise<FinancialMovement | null>;
  getByAccount(accountId: string): Promise<FinancialMovement[]>;
  save(movement: FinancialMovement): Promise<void>;
}
