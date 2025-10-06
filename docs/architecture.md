# Architecture Guide

## Overview

This application implements **Domain-Driven Design (DDD)** and **Hexagonal Architecture** patterns to create a maintainable, testable, and scalable codebase.

## Core Principles

### 1. Domain-Driven Design (DDD)

DDD focuses on the core domain and domain logic, using a model-driven design approach.

**Key Concepts:**
- **Ubiquitous Language** - Common language between developers and domain experts
- **Bounded Contexts** - Clear boundaries between different parts of the system
- **Aggregates** - Consistency boundaries that encapsulate business rules
- **Domain Events** - Capture important business events

### 2. Hexagonal Architecture (Ports & Adapters)

Isolates the core business logic from external concerns like databases, web frameworks, and external services.

**Key Benefits:**
- **Testability** - Easy to test business logic in isolation
- **Flexibility** - Easy to swap implementations (e.g., database, web framework)
- **Maintainability** - Clear separation of concerns

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ HTTP/REST   │  │   GraphQL   │  │     CLI     │        │
│  │ Controllers │  │  Resolvers  │  │ Controllers │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Command   │  │    Query    │  │   Event     │        │
│  │  Handlers   │  │  Handlers   │  │  Handlers   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Entities   │  │    Value    │  │   Domain    │        │
│  │ Aggregates  │  │   Objects   │  │   Events    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Prisma    │  │   Event     │  │   External  │        │
│  │ Repositories│  │   Bus       │  │   Services  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Presentation Layer

**Responsibility:** Handle user interface and external communication

**Components:**
- **HTTP Controllers** - REST API endpoints
- **GraphQL Resolvers** - GraphQL query/mutation handlers
- **CLI Controllers** - Command-line interface handlers

**Example:**
```typescript
@Controller('v1/users')
export class CreateUserHttpController {
  @Post()
  async createUser(@Body() body: CreateUserRequestDto) {
    const command = new CreateUserCommand(body);
    const result = await this.commandBus.execute(command);
    return result.unwrap();
  }
}
```

### Application Layer

**Responsibility:** Orchestrate business operations and coordinate between layers

**Components:**
- **Command Handlers** - Handle write operations (CQRS)
- **Query Handlers** - Handle read operations (CQRS)
- **Event Handlers** - Handle domain events
- **Application Services** - Coordinate complex operations

**Example:**
```typescript
@CommandHandler(CreateUserCommand)
export class CreateUserService implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand): Promise<Result<AggregateID, UserAlreadyExistsError>> {
    const user = UserEntity.create({
      email: command.email,
      address: new Address(command.address),
    });

    await this.userRepo.transaction(async () => this.userRepo.insert(user));
    return Ok(user.id);
  }
}
```

### Domain Layer

**Responsibility:** Contain business logic and domain rules

**Components:**
- **Entities** - Objects with identity and lifecycle
- **Aggregates** - Consistency boundaries
- **Value Objects** - Immutable objects without identity
- **Domain Events** - Capture business events
- **Domain Services** - Stateless business operations

**Example:**
```typescript
export class UserEntity extends AggregateRoot<UserProps> {
  static create(props: CreateUserProps): UserEntity {
    const user = new UserEntity({ id: new AggregateID(), ...props });
    user.addEvent(new UserCreatedDomainEvent({ userId: user.id }));
    return user;
  }

  changeAddress(newAddress: Address): void {
    this.props.address = newAddress;
    this.addEvent(new UserAddressChangedDomainEvent({ 
      userId: this.id, 
      newAddress 
    }));
  }
}
```

### Infrastructure Layer

**Responsibility:** Provide technical capabilities and external integrations

**Components:**
- **Repositories** - Data persistence implementations
- **Event Bus** - Event publishing and handling
- **External Services** - Third-party integrations
- **Database Adapters** - Database-specific implementations

**Example:**
```typescript
@Injectable()
export class UserRepository extends PrismaRepositoryBase<UserEntity, UserProps, UserModel> {
  protected getDelegate() {
    return this.client.user;
  }

  protected toDomainEntity(record: UserModel): UserEntity {
    return new UserEntity({
      id: new AggregateID(record.id),
      email: record.email,
      address: new Address({
        country: record.country,
        postalCode: record.postalCode,
        street: record.street,
      }),
    });
  }
}
```

## CQRS Pattern

**Command Query Responsibility Segregation** separates read and write operations.

### Commands (Write Operations)

- Modify system state
- Return success/failure results
- Trigger domain events
- Validate business rules

### Queries (Read Operations)

- Read system state
- Return data
- No side effects
- Can bypass domain layer for performance

## Event-Driven Architecture

### Domain Events

Capture important business events within the domain:

```typescript
export class UserCreatedDomainEvent extends DomainEvent {
  constructor(public readonly payload: { userId: AggregateID }) {
    super();
  }
}
```

### Event Handlers

React to domain events:

```typescript
@EventsHandler(UserCreatedDomainEvent)
export class UserCreatedEventHandler implements IEventHandler<UserCreatedDomainEvent> {
  async handle(event: UserCreatedDomainEvent): Promise<void> {
    // Create wallet for new user
    const wallet = WalletEntity.create({ userId: event.payload.userId });
    await this.walletRepo.insert(wallet);
  }
}
```

## Repository Pattern

Abstracts data access and provides a domain-oriented interface:

```typescript
export interface UserRepositoryPort extends RepositoryPort<UserEntity> {
  findByEmail(email: string): Promise<Option<UserEntity>>;
}
```

## Dependency Injection

Uses NestJS DI container to manage dependencies:

```typescript
// Module configuration
@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
})
export class UserModule {}

// Usage in service
@Injectable()
export class CreateUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}
}
```

## Testing Strategy

### Unit Tests
- Test domain logic in isolation
- Mock external dependencies
- Focus on business rules

### Integration Tests
- Test application services with real database
- Use test containers for database
- Test complete workflows

### E2E Tests
- Test through HTTP/GraphQL interfaces
- Use real database
- Test user scenarios

## Best Practices

1. **Keep domain layer pure** - No external dependencies
2. **Use dependency inversion** - Depend on abstractions, not concretions
3. **Implement ports and adapters** - Clear boundaries between layers
4. **Write tests first** - TDD approach for better design
5. **Use value objects** - Encapsulate primitive values
6. **Handle errors explicitly** - Use Result types instead of exceptions
7. **Publish domain events** - Decouple side effects from main operations
8. **Validate at boundaries** - Input validation at presentation layer
9. **Use transactions** - Ensure data consistency
10. **Follow naming conventions** - Clear, ubiquitous language
