# Testing Guide

## Overview

This project uses a comprehensive testing strategy with multiple levels of testing to ensure code quality, reliability, and maintainability.

## Testing Pyramid

```
        ┌─────────────────┐
        │   E2E Tests     │  ← Few, Slow, High Confidence
        │   (Cucumber)    │
        └─────────────────┘
      ┌───────────────────────┐
      │  Integration Tests    │  ← Some, Medium Speed
      │   (Jest + Prisma)     │
      └───────────────────────┘
    ┌─────────────────────────────┐
    │      Unit Tests             │  ← Many, Fast, Low Level
    │   (Jest + Mocks)            │
    └─────────────────────────────┘
```

## Test Types

### 1. Unit Tests

**Purpose:** Test individual components in isolation

**Characteristics:**
- Fast execution (< 1ms per test)
- No external dependencies
- Mock all dependencies
- Focus on business logic

**Example:**
```typescript
describe('UserEntity', () => {
  describe('create', () => {
    it('should create user with valid data', () => {
      // Arrange
      const props = {
        email: 'test@example.com',
        address: new Address({
          country: 'Vietnam',
          postalCode: '10000',
          street: 'Test Street',
        }),
      };

      // Act
      const user = UserEntity.create(props);

      // Assert
      expect(user.email).toBe('test@example.com');
      expect(user.getUncommittedEvents()).toHaveLength(1);
      expect(user.getUncommittedEvents()[0]).toBeInstanceOf(UserCreatedDomainEvent);
    });

    it('should throw error when email is invalid', () => {
      // Arrange
      const props = {
        email: 'invalid-email',
        address: new Address({
          country: 'Vietnam',
          postalCode: '10000',
          street: 'Test Street',
        }),
      };

      // Act & Assert
      expect(() => UserEntity.create(props)).toThrow(InvalidEmailError);
    });
  });
});
```

### 2. Integration Tests

**Purpose:** Test application services with real database

**Characteristics:**
- Medium execution time (100-500ms per test)
- Real database (test container)
- Real Prisma client
- Test complete workflows

**Example:**
```typescript
describe('CreateUserService (Integration)', () => {
  let app: INestApplication;
  let userRepo: UserRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userRepo = module.get<UserRepository>(USER_REPOSITORY);
    prisma = module.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create user and save to database', async () => {
    // Arrange
    const service = new CreateUserService(userRepo);
    const command = new CreateUserCommand({
      email: 'test@example.com',
      country: 'Vietnam',
      postalCode: '10000',
      street: 'Test Street',
    });

    // Act
    const result = await service.execute(command);

    // Assert
    expect(result.isOk()).toBe(true);
    
    const savedUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });
    expect(savedUser).toBeDefined();
    expect(savedUser.email).toBe('test@example.com');
  });
});
```

### 3. E2E Tests

**Purpose:** Test complete user scenarios through HTTP/GraphQL

**Characteristics:**
- Slow execution (1-5s per test)
- Real HTTP requests
- Real database
- Test user journeys

**Example:**
```typescript
// tests/user/create-user/create-user.e2e-spec.ts
import { loadFeature, defineFeature } from 'jest-cucumber';

const feature = loadFeature('./create-user.feature');

defineFeature(feature, (test) => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ctx: any = {};

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    prisma = module.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    ctx = {};
  });

  test('Create a user', ({ given, when, then, and }) => {
    given('I have user data', () => {
      ctx.userData = {
        email: 'test@example.com',
        country: 'Vietnam',
        postalCode: '10000',
        street: 'Test Street',
      };
    });

    when('I create a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/users')
        .send(ctx.userData)
        .expect(201);
      
      ctx.latestResponse = response.body;
    });

    then('I receive my user ID', () => {
      expect(typeof ctx.latestResponse.id).toBe('string');
    });

    and('I can see my user in a list of all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users')
        .expect(200);

      expect(
        response.body.data.some((item: any) => item.id === ctx.latestResponse.id)
      ).toBe(true);
    });
  });
});
```

## Test Configuration

### Jest Configuration

```json
// .jestrc.json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/src", "<rootDir>/tests"],
  "testMatch": ["**/*.spec.ts", "**/*.test.ts"],
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": [
    "src/**/*.(t|j)s",
    "!src/**/*.spec.ts",
    "!src/**/*.test.ts",
    "!src/main.ts"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": ["text", "lcov", "html"],
  "moduleNameMapping": {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@libs/(.*)$": "<rootDir>/src/libs/$1",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1"
  }
}
```

### Test Database Setup

```typescript
// tests/setup/test-database.ts
export class TestDatabase {
  private static instance: TestDatabase;
  private prisma: PrismaService;

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  async setup(): Promise<void> {
    // Setup test database
    this.prisma = new PrismaService();
    await this.prisma.$connect();
  }

  async cleanup(): Promise<void> {
    // Clean all tables
    await this.prisma.user.deleteMany();
    await this.prisma.wallet.deleteMany();
  }

  async teardown(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
```

## Mocking Strategies

### 1. Repository Mocking

```typescript
import { mock, MockProxy } from 'jest-mock-extended';

describe('CreateUserService', () => {
  let service: CreateUserService;
  let userRepo: MockProxy<UserRepositoryPort>;

  beforeEach(() => {
    userRepo = mock<UserRepositoryPort>();
    service = new CreateUserService(userRepo);
  });

  it('should call repository insert method', async () => {
    // Arrange
    const command = new CreateUserCommand({
      email: 'test@example.com',
      country: 'Vietnam',
      postalCode: '10000',
      street: 'Test Street',
    });

    // Act
    await service.execute(command);

    // Assert
    expect(userRepo.insert).toHaveBeenCalledWith(expect.any(UserEntity));
  });
});
```

### 2. External Service Mocking

```typescript
// Mock external services
jest.mock('@libs/email/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  })),
}));
```

### 3. Prisma Mocking (for unit tests)

```typescript
import { PrismaService } from '@libs/db/prisma.service';

const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as any;

jest.mock('@libs/db/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => mockPrisma),
}));
```

## Test Data Management

### 1. Test Factories

```typescript
// tests/factories/user.factory.ts
export class UserFactory {
  static create(overrides: Partial<CreateUserProps> = {}): UserEntity {
    return UserEntity.create({
      email: 'test@example.com',
      address: new Address({
        country: 'Vietnam',
        postalCode: '10000',
        street: 'Test Street',
      }),
      ...overrides,
    });
  }

  static createMany(count: number, overrides: Partial<CreateUserProps> = {}): UserEntity[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        email: `test${index}@example.com`,
        ...overrides,
      })
    );
  }
}
```

### 2. Database Seeding for Tests

```typescript
// tests/setup/test-seed.ts
export class TestSeed {
  constructor(private prisma: PrismaService) {}

  async seedUsers(count: number = 5): Promise<void> {
    const users = Array.from({ length: count }, (_, index) => ({
      id: `user-${index}`,
      email: `user${index}@example.com`,
      country: 'Vietnam',
      postalCode: '10000',
      street: `Street ${index}`,
      role: 'user',
    }));

    await this.prisma.user.createMany({ data: users });
  }
}
```

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run only unit tests
npm test -- --testPathPattern=src

# Run only integration tests
npm test -- --testPathPattern=tests.*integration

# Run only E2E tests
npm test -- --testPathPattern=tests.*e2e

# Run specific test file
npm test -- create-user.service.spec.ts

# Run tests in debug mode
npm run test:debug
```

### Coverage Requirements

- **Overall coverage**: Minimum 80%
- **Domain layer**: Minimum 90%
- **Application layer**: Minimum 85%
- **Infrastructure layer**: Minimum 70%

### Coverage Reports

```bash
# Generate coverage report
npm run test:cov

# Open coverage report in browser
open coverage/lcov-report/index.html
```

## Best Practices

### 1. Test Naming

```typescript
// ✅ Good - Descriptive test names
describe('CreateUserService', () => {
  describe('execute', () => {
    it('should create user successfully when valid data provided', () => {});
    it('should return error when user already exists', () => {});
    it('should throw exception when repository fails', () => {});
  });
});
```

### 2. AAA Pattern

```typescript
it('should create user successfully', async () => {
  // Arrange - Setup test data and mocks
  const command = new CreateUserCommand({
    email: 'test@example.com',
    country: 'Vietnam',
    postalCode: '10000',
    street: 'Test Street',
  });

  // Act - Execute the operation
  const result = await service.execute(command);

  // Assert - Verify the results
  expect(result.isOk()).toBe(true);
  expect(userRepo.insert).toHaveBeenCalledWith(expect.any(UserEntity));
});
```

### 3. Test Independence

```typescript
// ✅ Good - Each test is independent
beforeEach(async () => {
  // Clean database before each test
  await prisma.user.deleteMany();
  await prisma.wallet.deleteMany();
});
```

### 4. Meaningful Assertions

```typescript
// ✅ Good - Specific assertions
expect(result.isOk()).toBe(true);
expect(result.unwrap()).toBeInstanceOf(AggregateID);
expect(userRepo.insert).toHaveBeenCalledWith(
  expect.objectContaining({
    email: 'test@example.com',
  })
);

// ❌ Bad - Vague assertions
expect(result).toBeTruthy();
expect(userRepo.insert).toHaveBeenCalled();
```

## Debugging Tests

### 1. Debug Configuration

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--testPathPattern=${fileBasenameNoExtension}"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### 2. Debug Commands

```bash
# Debug specific test
npm run test:debug -- --testNamePattern="should create user"

# Debug with breakpoints
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run test:cov
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```
