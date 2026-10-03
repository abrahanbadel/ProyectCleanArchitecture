import { User as PrismaUser, Prisma } from '../../generated/prisma/client';
import { User } from '../../domain/entities/User';

export class UserMapper {
  /**
   * Convierte un registro de infraestructura a una entidad de dominio puro
   */
  public static toDomain(prismaUser: PrismaUser): User {
    return User.create({
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      fullName: prismaUser.fullName,
      createdAt: prismaUser.createdAt,
    });
  }

  /**
   * Convierte una entidad de dominio a la estructura requerida por Prisma
   */
  public static toPersistence(user: User): Prisma.UserUncheckedCreateInput {
    return {
      ...(user.id ? { id: user.id } : {}),
      email: user.email,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      createdAt: user.createdAt,
    };
  }
}
