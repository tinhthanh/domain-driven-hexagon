import { defineFeature, loadFeature } from 'jest-cucumber';
import { getPrismaService } from '../../setup/jestSetupAfterEnv';
import { UserResponseDto } from '@modules/user/dtos/user.response.dto';
import { PrismaService } from '@src/libs/db/prisma.service';
import { TestContext } from '@tests/test-utils/TestContext';
import { IdResponse } from '@src/libs/api/id.response.dto';
import {
  CreateUserTestContext,
  givenUserProfileData,
  iSendARequestToCreateAUser,
} from '../user-shared-steps';
import { ApiClient } from '@tests/test-utils/ApiClient';
import { iReceiveAnErrorWithStatusCode } from '@tests/shared/shared-steps';

const feature = loadFeature('tests/user/create-user/create-user.feature');

/**
 * e2e test implementing a Gherkin feature file
 * https://github.com/Sairyss/backend-best-practices#testing
 */

defineFeature(feature, (test) => {
  let prisma: PrismaService;
  const apiClient = new ApiClient();

  beforeAll(() => {
    prisma = getPrismaService();
  });

  afterEach(async () => {
    await prisma.wallet.deleteMany();
    await prisma.user.deleteMany();
  });

  test('I can create a user', ({ given, when, then, and }) => {
    const ctx = new TestContext<CreateUserTestContext>();

    givenUserProfileData(given, ctx);

    iSendARequestToCreateAUser(when, ctx);

    then('I receive my user ID', () => {
      const response = ctx.latestResponse as IdResponse;
      console.log('response', response.id);
      expect(typeof response.id).toBe('string');
    });

    and('I can see my user in a list of all users', async () => {
      const res = await apiClient.findAllUsers();
      const response = ctx.latestResponse as IdResponse;

      expect(
        res.data.some((item: UserResponseDto) => item.id === response.id),
      ).toBe(true);
    });
  });

  test('I try to create a user with invalid data', ({ given, when, then }) => {
    const ctx = new TestContext<CreateUserTestContext>();

    givenUserProfileData(given, ctx);

    iSendARequestToCreateAUser(when, ctx);

    iReceiveAnErrorWithStatusCode(then, ctx);
  });
});
