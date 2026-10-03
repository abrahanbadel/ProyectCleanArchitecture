import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from '../../src/use-cases/LoginUseCase';
import { UserRepository } from '../../src/domain/repositories/Repositories';
import { PasswordHasher } from '../../src/domain/services/PasswordHasher';
import { TokenService } from '../../src/domain/services/TokenService';
import { User } from '../../src/domain/entities/User';
import { InvalidCredentialsError } from '../../src/domain/exceptions/UserError';

describe('LoginUseCase', () => {
  let mockUserRepo: UserRepository;
  let mockTokenService: TokenService;
  let mockPasswordHasher: PasswordHasher;
  let useCase: LoginUseCase;

  beforeEach(() => {
    mockUserRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByFullName: vi.fn(),
      save: vi.fn(),
    };
    mockTokenService = {
      generateToken: vi.fn().mockReturnValue('jwt-sample-token'),
      verifyToken: vi.fn(),
    };
    mockPasswordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    };
    useCase = new LoginUseCase(mockUserRepo, mockTokenService, mockPasswordHasher);
  });

  it('Escenario 1: Login exitoso retorna token y datos de usuario', async () => {
    const user = User.create({
      id: 'user-1',
      fullName: 'Carlos Gomez',
      email: 'carlos@example.com',
      passwordHash: '$2b$10$hashed',
      createdAt: new Date(),
    });
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(user);
    vi.mocked(mockPasswordHasher.compare).mockResolvedValue(true);

    const result = await useCase.execute({
      email: 'carlos@example.com',
      password: 'Password123',
    });

    expect(result.token).toBe('jwt-sample-token');
    expect(result.user.id).toBe('user-1');
    expect(result.user.email).toBe('carlos@example.com');
    expect(mockTokenService.generateToken).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'carlos@example.com',
    });
  });

  it('Escenario 2: Lanza InvalidCredentialsError si el email no existe', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'unknown@example.com', password: 'Password123' })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('Escenario 3: Lanza InvalidCredentialsError si la contraseña no coincide', async () => {
    const user = User.create({
      id: 'user-1',
      fullName: 'Carlos Gomez',
      email: 'carlos@example.com',
      passwordHash: '$2b$10$hashed',
      createdAt: new Date(),
    });
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(user);
    vi.mocked(mockPasswordHasher.compare).mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'carlos@example.com', password: 'WrongPassword' })
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
