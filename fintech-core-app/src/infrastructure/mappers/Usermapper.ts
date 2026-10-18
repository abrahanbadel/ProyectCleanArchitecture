import { User as PrismaUser, Prisma } from '../../generated/prisma/client';
import { User } from '../../domain/entities/User';

export class UserPersistenceMapper {
  public static mapToDomain(raw: PrismaUser): User {
    return User.create({
      id: raw.id,
      email: raw.email,
      passwordHash: raw.passwordHash,
      fullName: raw.fullName,
      createdAt: raw.createdAt,
    });
  }

  public static mapToDb(user: User): Prisma.UserUncheckedCreateInput {
    return {
      ...(user.id ? { id: user.id } : {}),
      email: user.email,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      createdAt: user.createdAt,
    };
  }

  /** Alias pedido por el laboratorio (toDomain / toPersistence). */
  public static toDomain(raw: PrismaUser): User {
    return UserPersistenceMapper.mapToDomain(raw);
  }

  public static toPersistence(user: User): Prisma.UserUncheckedCreateInput {
    return UserPersistenceMapper.mapToDb(user);
  }
}
