# Coding Rules & Guidelines

## Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript Standards](#typescript-standards)
3. [NestJS Best Practices](#nestjs-best-practices)
4. [Domain-Driven Design Patterns](#domain-driven-design-patterns)
5. [File & Folder Structure](#file--folder-structure)
6. [Naming Conventions](#naming-conventions)
7. [Error Handling](#error-handling)
8. [Testing Requirements](#testing-requirements)
9. [Code Review Checklist](#code-review-checklist)

## General Principles

### 1. SOLID Principles

- **Single Responsibility** - Each class should have one reason to change
- **Open/Closed** - Open for extension, closed for modification
- **Liskov Substitution** - Subtypes must be substitutable for base types
- **Interface Segregation** - Clients shouldn't depend on unused interfaces
- **Dependency Inversion** - Depend on abstractions, not concretions

### 2. Clean Code

- **Meaningful names** - Use intention-revealing names
- **Small functions** - Functions should do one thing well
- **No comments** - Code should be self-documenting
- **Consistent formatting** - Use Prettier for automatic formatting
- **No magic numbers** - Use named constants

### 3. DRY (Don't Repeat Yourself)

- Extract common functionality into reusable components
- Use inheritance and composition appropriately
- Create utility functions for repeated operations

## TypeScript Standards

### 1. Type Safety

```typescript
// ✅ Good - Explicit types
interface CreateUserProps {
  email: string;
  address: Address;
}

// ❌ Bad - Any types
function createUser(props: any): any {
  // ...
}
```

### 2. Strict Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true
  }
}
```

### 3. Prefer Interfaces over Types

```typescript
// ✅ Good
interface UserProps {
  id: string;
  email: string;
}

// ❌ Avoid (unless union types needed)
type UserProps = {
  id: string;
  email: string;
};
```

## NestJS Best Practices

### 1. Module Organization

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [CreateUserHttpController, FindUsersHttpController],
  providers: [
    CreateUserService,
    FindUsersQueryHandler,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
```

### 2. Dependency Injection

```typescript
// ✅ Good - Use tokens for abstractions
@Injectable()
export class CreateUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}
}

// ❌ Bad - Direct class dependency
@Injectable()
export class CreateUserService {
  constructor(private readonly userRepo: UserRepository) {}
}
```

### 3. Validation

```typescript
// ✅ Good - Use class-validator
export class CreateUserRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}
```

## Domain-Driven Design Patterns

### 1. Entity Structure

```typescript
export class UserEntity extends AggregateRoot<UserProps> {
  // ✅ Good - Factory method
  static create(props: CreateUserProps): UserEntity {
    const user = new UserEntity({
      id: new AggregateID(),
      ...props,
    });
    user.addEvent(new UserCreatedDomainEvent({ userId: user.id }));
    return user;
  }

  // ✅ Good - Business methods
  changeEmail(newEmail: string): void {
    if (!this.isValidEmail(newEmail)) {
      throw new InvalidEmailError(newEmail);
    }
    this.props.email = newEmail;
    this.addEvent(new UserEmailChangedDomainEvent({ userId: this.id, newEmail }));
  }

  // ✅ Good - Private validation
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### 2. Value Objects

```typescript
export class Address extends ValueObject<AddressProps> {
  constructor(props: AddressProps) {
    super(props);
    this.validate();
  }

  private validate(): void {
    if (!this.props.country) {
      throw new InvalidAddressError('Country is required');
    }
    if (!this.props.postalCode) {
      throw new InvalidAddressError('Postal code is required');
    }
  }

  // ✅ Good - Immutable operations
  withCountry(country: string): Address {
    return new Address({ ...this.props, country });
  }
}
```

### 3. Repository Pattern

```typescript
// ✅ Good - Port interface
export interface UserRepositoryPort extends RepositoryPort<UserEntity> {
  findByEmail(email: string): Promise<Option<UserEntity>>;
}

// ✅ Good - Implementation
@Injectable()
export class UserRepository extends PrismaRepositoryBase<UserEntity, UserProps, UserModel>
  implements UserRepositoryPort {
  
  async findByEmail(email: string): Promise<Option<UserEntity>> {
    const record = await this.client.user.findUnique({ where: { email } });
    return record ? Some(this.toDomainEntity(record)) : None;
  }
}
```

## File & Folder Structure

### 1. Module Structure

```
src/modules/user/
├── commands/
│   ├── create-user/
│   │   ├── create-user.command.ts
│   │   ├── create-user.service.ts
│   │   ├── create-user.http-controller.ts
│   │   └── create-user.cli-controller.ts
│   └── delete-user/
├── queries/
│   └── find-users/
├── database/
│   ├── user.repository.ts
│   └── user.repository.port.ts
├── domain/
│   ├── user.entity.ts
│   ├── user.errors.ts
│   └── value-objects/
├── dtos/
└── user.module.ts
```

### 2. File Naming

- **Kebab-case** for file names: `create-user.service.ts`
- **PascalCase** for class names: `CreateUserService`
- **camelCase** for variables and functions: `createUser`
- **SCREAMING_SNAKE_CASE** for constants: `USER_REPOSITORY`

## Naming Conventions

### 1. Classes

```typescript
// ✅ Good
export class UserEntity extends AggregateRoot<UserProps> {}
export class CreateUserCommand {}
export class UserRepository {}
export class UserCreatedDomainEvent {}
```

### 2. Interfaces

```typescript
// ✅ Good - Port suffix for domain interfaces
export interface UserRepositoryPort {}
export interface EmailServicePort {}

// ✅ Good - Props suffix for data structures
export interface UserProps {}
export interface CreateUserProps {}
```

### 3. Files

```typescript
// ✅ Good
user.entity.ts
create-user.command.ts
user.repository.port.ts
user-created.domain-event.ts
```

### 4. DI Tokens

```typescript
// ✅ Good - Descriptive constants
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
```

## Error Handling

### 1. Domain Errors

```typescript
// ✅ Good - Specific domain errors
export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
}

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email format: ${email}`);
  }
}
```

### 2. Result Pattern

```typescript
// ✅ Good - Use Result type for operations that can fail
async execute(command: CreateUserCommand): Promise<Result<AggregateID, UserAlreadyExistsError>> {
  try {
    const user = UserEntity.create(command);
    await this.userRepo.insert(user);
    return Ok(user.id);
  } catch (error) {
    if (error instanceof ConflictException) {
      return Err(new UserAlreadyExistsError(command.email));
    }
    throw error;
  }
}
```

### 3. Exception Handling

```typescript
// ✅ Good - Handle at boundaries
@Post()
async createUser(@Body() body: CreateUserRequestDto): Promise<IdResponse> {
  const command = new CreateUserCommand(body);
  const result = await this.commandBus.execute(command);
  
  if (result.isErr()) {
    throw new ConflictException(result.unwrapErr().message);
  }
  
  return new IdResponse(result.unwrap());
}
```

## Testing Requirements

### 1. Test Structure

```typescript
describe('CreateUserService', () => {
  let service: CreateUserService;
  let userRepo: MockProxy<UserRepositoryPort>;

  beforeEach(() => {
    userRepo = mock<UserRepositoryPort>();
    service = new CreateUserService(userRepo);
  });

  describe('execute', () => {
    it('should create user successfully', async () => {
      // Arrange
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
      expect(userRepo.insert).toHaveBeenCalledWith(expect.any(UserEntity));
    });
  });
});
```

### 2. Test Coverage

- **Unit tests** - Minimum 80% coverage
- **Integration tests** - All application services
- **E2E tests** - All API endpoints

### 3. Test Naming

```typescript
// ✅ Good - Descriptive test names
it('should create user successfully when valid data provided')
it('should return error when user already exists')
it('should throw exception when invalid email format')
```

## Code Review Checklist

### ✅ Architecture

- [ ] Follows DDD and Hexagonal Architecture patterns
- [ ] Proper layer separation (no domain dependencies on infrastructure)
- [ ] Uses dependency inversion principle
- [ ] Implements CQRS pattern correctly

### ✅ Code Quality

- [ ] No code duplication
- [ ] Functions are small and focused
- [ ] Meaningful variable and function names
- [ ] No magic numbers or strings
- [ ] Proper error handling

### ✅ TypeScript

- [ ] Strict type checking enabled
- [ ] No `any` types used
- [ ] Proper interface definitions
- [ ] Generic types used appropriately

### ✅ Testing

- [ ] Unit tests for business logic
- [ ] Integration tests for application services
- [ ] E2E tests for API endpoints
- [ ] Minimum 80% test coverage

### ✅ Documentation

- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Complex business logic documented
- [ ] Architecture decisions documented

### ✅ Performance

- [ ] No N+1 queries
- [ ] Proper database indexing
- [ ] Efficient data structures used
- [ ] No memory leaks

### ✅ Security

- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] Proper authentication/authorization
- [ ] Sensitive data not logged

## Git Workflow

### 1. Branch Naming

```bash
# ✅ Good
feature/user-registration
bugfix/user-email-validation
hotfix/security-vulnerability
```

### 2. Commit Messages

```bash
# ✅ Good
feat(user): add user registration endpoint
fix(user): validate email format properly
docs(api): update user API documentation
test(user): add integration tests for user creation
```

### 3. Pull Request Guidelines

- Write clear description of changes
- Include screenshots for UI changes
- Reference related issues
- Ensure all tests pass
- Request review from team members

## Performance Guidelines

### 1. Database Queries

```typescript
// ✅ Good - Use select to limit fields
const users = await this.prisma.user.findMany({
  select: { id: true, email: true },
  where: { country: 'Vietnam' },
});

// ❌ Bad - Fetching all fields
const users = await this.prisma.user.findMany({
  where: { country: 'Vietnam' },
});
```

### 2. Pagination

```typescript
// ✅ Good - Always implement pagination
async findAll(query: FindUsersQuery): Promise<Paginated<UserModel>> {
  const [records, total] = await Promise.all([
    this.prisma.user.findMany({
      skip: query.offset,
      take: query.limit,
    }),
    this.prisma.user.count(),
  ]);

  return new Paginated({ data: records, count: total, limit: query.limit, page: query.page });
}
```
