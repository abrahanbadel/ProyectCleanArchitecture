import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUserUseCase } from '../../src/use-cases/RegisterUserUseCase';
import { UserRepository, AccountRepository } from '../../src/domain/repositories/Repositories';
import { PasswordHasher } from '../../src/domain/services/PasswordHasher';
import { User } from '../../src/domain/entities/User';
import { UserAlreadyExistsError } from '../../src/domain/exceptions/UserError';

describe('RegisterUserUseCase', () => {
  let mockUserRepo: UserRepository;
  let mockAccountRepo: AccountRepository;
  let mockPasswordHasher: PasswordHasher;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    mockUserRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByFullName: vi.fn(),
      save: vi.fn(),
    };
    mockAccountRepo = {
      findById: vi.fn(),
      findByAccountNumber: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      executeTransaction: vi.fn(),
    };
    mockPasswordHasher = {
      hash: vi.fn().mockResolvedValue('$2b$10$hashedpassword'),
      compare: vi.fn().mockResolvedValue(true),
    };
    useCase = new RegisterUserUseCase(mockUserRepo, mockPasswordHasher, mockAccountRepo);
  });

  it('Escenario 1: Registro exitoso crea usuario y cuenta inicial', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUserRepo.save).mockImplementation(async (user: User) => user);

    const input = {
      name: 'Carlos Gomez',
      email: 'carlos@example.com',
      password: 'Password123',
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Carlos Gomez');
    expect(result.email).toBe('carlos@example.com');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('Password123');
    expect(mockUserRepo.save).toHaveBeenCalledOnce();
    expect(mockAccountRepo.save).toHaveBeenCalledOnce();
  });

  it('Escenario 2: Lanza UserAlreadyExistsError si el correo ya está registrado', async () => {
    const existing = User.create({
      id: 'existing-id',
      fullName: 'Carlos Gomez',
      email: 'carlos@example.com',
      passwordHash: 'hashed',
      createdAt: new Date(),
    });
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(existing);

    const input = {
      name: 'Carlos Gomez',
      email: 'carlos@example.com',
      password: 'Password123',
    };

    await expect(useCase.execute(input)).rejects.toThrow(UserAlreadyExistsError);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockAccountRepo.save).not.toHaveBeenCalled();
  });
});
