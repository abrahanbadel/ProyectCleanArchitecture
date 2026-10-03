import { PrismaClient } from '../../generated/prisma/client';
import { UserRepository } from '../../domain/repositories/Repositories';
import { User } from '../../domain/entities/User';
import { UserMapper } from '../mappers/Usermapper';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);

    const prismaUser = user.id
      ? await this.prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            passwordHash: user.passwordHash,
            fullName: user.fullName,
          },
          create: data,
        })
      : await this.prisma.user.create({ data });

    return UserMapper.toDomain(prismaUser);
  }

  async findById(id: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!prismaUser) return null;

    return UserMapper.toDomain(prismaUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!prismaUser) return null;

    return UserMapper.toDomain(prismaUser);
  }

  async findByFullName(fullName: string): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany({
      where: { fullName },
    });

    return prismaUsers.map(UserMapper.toDomain);
  }
}
