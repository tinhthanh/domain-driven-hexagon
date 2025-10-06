import { z } from 'zod';
import { PrismaRepositoryBase } from '@src/libs/db/prisma-repository.base';
import { PrismaService } from '@src/libs/db/prisma.service';
import { WalletRepositoryPort } from './wallet.repository.port';
import { WalletEntity } from '../domain/wallet.entity';
import { WalletMapper } from '../wallet.mapper';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export const walletSchema = z.object({
  id: z.string().min(1).max(255),
  createdAt: z.preprocess((val: any) => new Date(val), z.date()),
  updatedAt: z.preprocess((val: any) => new Date(val), z.date()),
  balance: z.number().min(0).max(9999999),
  userId: z.string().min(1).max(255),
});

export type WalletModel = z.TypeOf<typeof walletSchema>;

@Injectable()
export class WalletRepository
  extends PrismaRepositoryBase<WalletEntity, WalletModel>
  implements WalletRepositoryPort
{
  protected tableName = 'wallets';

  constructor(
    prisma: PrismaService,
    mapper: WalletMapper,
    eventEmitter: EventEmitter2,
  ) {
    super(prisma, mapper, eventEmitter, new Logger(WalletRepository.name));
  }

  protected getDelegate() {
    return this.client.wallet;
  }
}
