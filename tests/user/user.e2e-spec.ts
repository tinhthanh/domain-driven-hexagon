import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppHelper } from '../helpers/test-app.helper';
import { UserFactory } from '../factories/user.factory';
import { PrismaService } from '@src/infrastructure/persistence/prisma/prisma.service';

describe('User Module (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await TestAppHelper.getApp();
    prisma = await TestAppHelper.getPrisma();
  });

  beforeEach(async () => {
    await TestAppHelper.cleanDatabase();
    UserFactory.reset();
  });

  afterAll(async () => {
    await TestAppHelper.closeApp();
  });

  describe('POST /v1/users (Create User)', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const createUserDto = UserFactory.createUserDto();

      // Act
      const response = await request(app.getHttpServer())
        .post('/v1/users')
        .send(createUserDto)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(typeof response.body.id).toBe('string');

      // Verify in database
      const userInDb = await prisma.user.findUnique({
        where: { email: createUserDto.email },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb?.email).toBe(createUserDto.email);
      expect(userInDb?.country).toBe(createUserDto.country);
    });

    it('should return 409 when creating user with duplicate email', async () => {
      // Arrange
      const createUserDto = UserFactory.createUserDto();

      // Create first user
      await request(app.getHttpServer())
        .post('/v1/users')
        .send(createUserDto)
        .expect(201);

      // Act & Assert - Try to create duplicate
      await request(app.getHttpServer())
        .post('/v1/users')
        .send(createUserDto)
        .expect(409);
    });

    it('should return 400 when email is invalid', async () => {
      // Arrange
      const invalidUserDto = UserFactory.createUserDto({
        email: 'invalid-email',
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/v1/users')
        .send(invalidUserDto)
        .expect(400);
    });

    it('should return 400 when required fields are missing', async () => {
      // Act & Assert
      await request(app.getHttpServer()).post('/v1/users').send({}).expect(400);
    });

    it('should create user and automatically create wallet', async () => {
      // Arrange
      const createUserDto = UserFactory.createUserDto();

      // Act
      const response = await request(app.getHttpServer())
        .post('/v1/users')
        .send(createUserDto)
        .expect(201);

      // Assert - Check wallet was created
      const wallet = await prisma.wallet.findFirst({
        where: { userId: response.body.id },
      });
      expect(wallet).toBeDefined();
      expect(wallet?.balance).toBe(0);
    });
  });

  describe('GET /v1/users (Find Users)', () => {
    it('should return empty list when no users exist', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/v1/users')
        .expect(200);

      // Assert
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should return list of users', async () => {
      // Arrange - Create 3 users
      const users = UserFactory.createManyUserDtos(3);
      for (const user of users) {
        await request(app.getHttpServer()).post('/v1/users').send(user);
      }

      // Act
      const response = await request(app.getHttpServer())
        .get('/v1/users')
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('email');
    });

    it('should support pagination', async () => {
      // Arrange - Create 5 users
      const users = UserFactory.createManyUserDtos(5);
      for (const user of users) {
        await request(app.getHttpServer()).post('/v1/users').send(user);
      }

      // Act - Get page 1 with limit 2
      const response = await request(app.getHttpServer())
        .get('/v1/users?page=1&limit=2')
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(5);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
    });

    it('should filter users by country', async () => {
      // Arrange - Create users with different countries
      await request(app.getHttpServer())
        .post('/v1/users')
        .send(
          UserFactory.createUserDto({
            email: 'vietnam@example.com',
            country: 'Vietnam',
          }),
        );

      await request(app.getHttpServer())
        .post('/v1/users')
        .send(
          UserFactory.createUserDto({
            email: 'thailand@example.com',
            country: 'Thailand',
          }),
        );

      // Act - Filter by Vietnam
      const response = await request(app.getHttpServer())
        .get('/v1/users?country=Vietnam')
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].country).toBe('Vietnam');
      expect(response.body.data[0].email).toBe('vietnam@example.com');
    });
  });

  describe('DELETE /v1/users/:id (Delete User)', () => {
    it('should delete user successfully', async () => {
      // Arrange - Create a user
      const createUserDto = UserFactory.createUserDto();
      const createResponse = await request(app.getHttpServer())
        .post('/v1/users')
        .send(createUserDto)
        .expect(201);

      const userId = createResponse.body.id;

      // Act - Delete the user
      await request(app.getHttpServer())
        .delete(`/v1/users/${userId}`)
        .expect(200);

      // Assert - User should not exist
      const userInDb = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(userInDb).toBeNull();
    });

    it('should return 404 when deleting non-existent user', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .delete('/v1/users/non-existent-id')
        .expect(404);
    });

    it('should delete user and associated wallet', async () => {
      // Arrange - Create a user (wallet is auto-created)
      const createUserDto = UserFactory.createUserDto();
      const createResponse = await request(app.getHttpServer())
        .post('/v1/users')
        .send(createUserDto)
        .expect(201);

      const userId = createResponse.body.id;

      // Verify wallet exists
      const walletBefore = await prisma.wallet.findFirst({
        where: { userId },
      });
      expect(walletBefore).toBeDefined();

      // Act - Delete the user
      await request(app.getHttpServer())
        .delete(`/v1/users/${userId}`)
        .expect(200);

      // Assert - Wallet should also be deleted
      const walletAfter = await prisma.wallet.findFirst({
        where: { userId },
      });
      expect(walletAfter).toBeNull();
    });
  });

  describe('GraphQL Queries', () => {
    it('should query users via GraphQL', async () => {
      // Arrange - Create a user
      const createUserDto = UserFactory.createUserDto();
      await request(app.getHttpServer()).post('/v1/users').send(createUserDto);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              findUsers(options: "{}") {
                count
                data {
                  id
                  email
                  country
                }
              }
            }
          `,
        })
        .expect(200);

      // Assert
      expect(response.body.data.findUsers.count).toBe(1);
      expect(response.body.data.findUsers.data[0].email).toBe(
        createUserDto.email,
      );
    });

    it('should create user via GraphQL', async () => {
      // Arrange
      const createUserDto = UserFactory.createUserDto();

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateUser($input: CreateUserGqlRequestDto!) {
              create(input: $input) {
                id
              }
            }
          `,
          variables: {
            input: createUserDto,
          },
        })
        .expect(200);

      // Assert
      expect(response.body.data.create).toHaveProperty('id');

      // Verify in database
      const userInDb = await prisma.user.findUnique({
        where: { email: createUserDto.email },
      });
      expect(userInDb).toBeDefined();
    });
  });
});
