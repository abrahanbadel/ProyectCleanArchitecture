import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserLoginService } from '../../src/use-cases/LoginUseCase';
import { UserPersistence } from '../../src/domain/repositories/Repositories';
import { PasswordHasher } from '../../src/domain/services/PasswordHasher';
import { TokenService } from '../../src/domain/services/TokenService';
import { User } from '../../src/domain/entities/User';
import { InvalidCredentialsError } from '../../src/domain/exceptions/UserError';

describe('UserLoginService', () => {
  let userRepo: UserPersistence;
  let tokenProvider: TokenService;
  let pwdHasher: PasswordHasher;
  let service: UserLoginService;

  beforeEach(() => {
    userRepo = {
      getById: vi.fn(),
      getByEmail: vi.fn(),
      searchByName: vi.fn(),
      upsert: vi.fn(),
    };
    tokenProvider = {
      generateToken: vi.fn().mockReturnValue('jwt-sample-token'),
      verifyToken: vi.fn(),
    };
    pwdHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    };
    service = new UserLoginService(userRepo, tokenProvider, pwdHasher);
  });

  it('RF-1.2 Escenario 1: login exitoso retorna token y datos de usuario', async () => {
    const holder = User.create({
      id: 'user-1',
      fullName: 'Carlos Gomez',
      email: 'carlos@example.com',
      passwordHash: '$2b$10$hashed',
      createdAt: new Date(),
    });
    vi.mocked(userRepo.getByEmail).mockResolvedValue(holder);
    vi.mocked(pwdHasher.compare).mockResolvedValue(true);

    const result = await service.execute({
      email: 'carlos@example.com',
      password: 'Password123',
    });

    expect(result.token).toBe('jwt-sample-token');
    expect(result.user.id).toBe('user-1');
    expect(result.user.email).toBe('carlos@example.com');
    expect(tokenProvider.generateToken).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'carlos@example.com',
    });
  });

  it('RF-1.2 Escenario 2: rechaza email inexistente', async () => {
    vi.mocked(userRepo.getByEmail).mockResolvedValue(null);

    await expect(
      service.execute({ email: 'unknown@example.com', password: 'Password123' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('RF-1.2 Escenario 3: rechaza contraseña incorrecta', async () => {
    const holder = User.create({
      id: 'user-1',
      fullName: 'Carlos Gomez',
      email: 'carlos@example.com',
      passwordHash: '$2b$10$hashed',
      createdAt: new Date(),
    });
    vi.mocked(userRepo.getByEmail).mockResolvedValue(holder);
    vi.mocked(pwdHasher.compare).mockResolvedValue(false);

    await expect(
      service.execute({ email: 'carlos@example.com', password: 'WrongPassword' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
