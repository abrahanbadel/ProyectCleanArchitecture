import { PrismaClient } from '../../generated/prisma/client';
import { UserPersistence } from '../../domain/repositories/Repositories';
import { User } from '../../domain/entities/User';
import { UserPersistenceMapper } from '../mappers/Usermapper';

export class SqlUserPersistence implements UserPersistence {
  constructor(private readonly db: PrismaClient) { }

  async upsert(user: User): Promise<User> {
    const dbData = UserPersistenceMapper.mapToDb(user);

    const result = user.id
      ? await this.db.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            passwordHash: user.passwordHash,
            fullName: user.fullName,
          },
          create: dbData,
        })
      : await this.db.user.create({ data: dbData });

    return UserPersistenceMapper.mapToDomain(result);
  }

  async getById(id: string): Promise<User | null> {
    const raw = await this.db.user.findUnique({ where: { id } });
    return raw ? UserPersistenceMapper.mapToDomain(raw) : null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const raw = await this.db.user.findUnique({ where: { email } });
    return raw ? UserPersistenceMapper.mapToDomain(raw) : null;
  }

  async searchByName(fullName: string): Promise<User[]> {
    const rawList = await this.db.user.findMany({ where: { fullName } });
    return rawList.map(UserPersistenceMapper.mapToDomain);
  }
}
