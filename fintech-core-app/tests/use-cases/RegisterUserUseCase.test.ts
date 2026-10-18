import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRegistrationService } from '../../src/use-cases/RegisterUserUseCase';
import {
  UserPersistence,
  BankAccountPersistence,
} from '../../src/domain/repositories/Repositories';
import { PasswordHasher } from '../../src/domain/services/PasswordHasher';
import { User } from '../../src/domain/entities/User';
import { UserAlreadyExistsError } from '../../src/domain/exceptions/UserError';

describe('UserRegistrationService', () => {
  let userRepo: UserPersistence;
  let bankRepo: BankAccountPersistence;
  let pwdHasher: PasswordHasher;
  let service: UserRegistrationService;

  beforeEach(() => {
    userRepo = {
      getById: vi.fn(),
      getByEmail: vi.fn(),
      searchByName: vi.fn(),
      upsert: vi.fn(),
    };
    bankRepo = {
      getById: vi.fn(),
      getByIban: vi.fn(),
      getByOwner: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      persist: vi.fn(),
      recordMovement: vi.fn(),
    };
    pwdHasher = {
      hash: vi.fn().mockResolvedValue('$2b$10$hashedpassword'),
      compare: vi.fn().mockResolvedValue(true),
    };
    service = new UserRegistrationService(userRepo, pwdHasher, bankRepo);
  });

  it('RF-1.1 Escenario 1: registro exitoso crea usuario y cuenta inicial', async () => {
    vi.mocked(userRepo.getByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.upsert).mockImplementation(async (user: User) => user);

    const result = await service.execute({
      name: 'Carlos Gomez',
      email: 'carlos@example.com',
      password: 'Password123',
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Carlos Gomez');
    expect(result.email).toBe('carlos@example.com');
    expect(pwdHasher.hash).toHaveBeenCalledWith('Password123');
    expect(userRepo.upsert).toHaveBeenCalledOnce();
    expect(bankRepo.save).toHaveBeenCalledOnce();
  });

  it('RF-1.1 Escenario 2: rechaza correo ya registrado', async () => {
    const existing = User.create({
      id: 'existing-id',
      fullName: 'Carlos Gomez',
      email: 'carlos@example.com',
      passwordHash: 'hashed',
      createdAt: new Date(),
    });
    vi.mocked(userRepo.getByEmail).mockResolvedValue(existing);

    await expect(
      service.execute({
        name: 'Carlos Gomez',
        email: 'carlos@example.com',
        password: 'Password123',
      }),
    ).rejects.toThrow(UserAlreadyExistsError);

    expect(userRepo.upsert).not.toHaveBeenCalled();
    expect(bankRepo.save).not.toHaveBeenCalled();
  });
});
