import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@src/infrastructure/persistence/prisma/prisma.service';

export class TestAppHelper {
  private static app: INestApplication;
  private static prisma: PrismaService;

  static async getApp(): Promise<INestApplication> {
    if (!this.app) {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      this.app = moduleFixture.createNestApplication();
      this.app.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: true }),
      );

      this.prisma = this.app.get<PrismaService>(PrismaService);

      await this.app.init();
    }
    return this.app;
  }

  static async getPrisma(): Promise<PrismaService> {
    if (!this.prisma) {
      await this.getApp();
    }
    return this.prisma;
  }

  static async cleanDatabase(): Promise<void> {
    const prisma = await this.getPrisma();

    // Delete in correct order to respect foreign key constraints
    await prisma.wallet.deleteMany();
    await prisma.user.deleteMany();
  }

  static async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }
}
