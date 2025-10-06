# Domain-Driven Hexagon

🏗️ **A modern NestJS application implementing Domain-Driven Design (DDD) and Hexagonal Architecture patterns with TypeScript, Prisma, and comprehensive testing.**

[![NestJS](https://img.shields.io/badge/NestJS-11.1.6-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.3-green.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Jest](https://img.shields.io/badge/Jest-29.7.0-orange.svg)](https://jestjs.io/)

## 🎯 Overview

This project demonstrates a production-ready implementation of:

- **Domain-Driven Design (DDD)** - Strategic and tactical patterns
- **Hexagonal Architecture** - Ports and adapters pattern
- **CQRS** - Command Query Responsibility Segregation
- **Event-Driven Architecture** - Domain events and event sourcing
- **Clean Architecture** - Dependency inversion and separation of concerns

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.1.0+ (managed with Volta)
- **PostgreSQL** 15+
- **Docker** & **Docker Compose** (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd domain-driven-hexagon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database configuration
   ```

4. **Start PostgreSQL with Docker**
   ```bash
   docker-compose --file docker/docker-compose.yml up -d
   ```

5. **Setup database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed database
   npm run db:seed
   ```

6. **Start the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## 📚 Available Scripts

### Development
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build the application
- `npm run start:prod` - Start in production mode

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:migrate:deploy` - Deploy migrations (production)
- `npm run db:migrate:reset` - Reset database and run all migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data

### Testing
- `npm test` - Run unit and integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:debug` - Run tests in debug mode

### Code Quality
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run deps:validate` - Validate dependencies
- `npm run deps:graph` - Generate dependency graph

## 🔧 Technology Stack

### Core Framework
- **NestJS 11.1.6** - Progressive Node.js framework
- **TypeScript 5.9.3** - Type-safe JavaScript
- **Node.js 20.1.0** - JavaScript runtime

### Database & ORM
- **PostgreSQL 15+** - Primary database
- **Prisma 6.16.3** - Modern ORM with type safety
- **Prisma Migrate** - Database migration tool

### Architecture Patterns
- **CQRS** - Command Query Responsibility Segregation
- **Event Sourcing** - Domain events and event handlers
- **Repository Pattern** - Data access abstraction
- **Dependency Injection** - Inversion of control

### Testing
- **Jest 29.7.0** - Testing framework
- **Jest-Cucumber** - BDD testing with Gherkin
- **Supertest** - HTTP assertion library

### API & Documentation
- **GraphQL** - Query language and runtime
- **Apollo Server 5** - Modern GraphQL server
- **Swagger/OpenAPI** - REST API documentation
- **Class Validator** - DTO validation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Volta** - Node.js version management

## 🌐 API Endpoints

### REST API
- `GET /v1/users` - Get all users with pagination
- `POST /v1/users` - Create a new user
- `DELETE /v1/users/:id` - Delete a user

### GraphQL
- Access GraphQL Playground at `http://localhost:3000/graphql`

### CLI Commands
- `npm run cli new:user <email> <country> <postalCode> <street>` - Create user via CLI

## 📖 Documentation

- [Architecture Guide](docs/architecture.md) - Detailed architecture documentation
- [Coding Rules](docs/coding-rules.md) - Development standards and guidelines
- [API Documentation](docs/api.md) - Complete API reference
- [Testing Guide](docs/testing.md) - Testing strategies and best practices

## 🤝 Contributing

1. Read the [Coding Rules](docs/coding-rules.md)
2. Follow the [Architecture Guide](docs/architecture.md)
3. Write tests following the [Testing Guide](docs/testing.md)
4. Ensure all tests pass: `npm test`
5. Lint your code: `npm run lint`
6. Format your code: `npm run format`

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by Domain-Driven Design principles by Eric Evans
- Hexagonal Architecture pattern by Alistair Cockburn
- Clean Architecture concepts by Robert C. Martin

---

**Note**: This is an updated version of the original Domain-Driven Hexagon project, now using:
- NestJS 11.1.6 (upgraded from 9.x)
- Prisma 6.16.3 (migrated from Slonik)
- TypeScript 5.9.3 (upgraded from 4.x)
- Jest 29.7.0 (upgraded from 28.x)
- Apollo Server 5.0.0 (upgraded from 3.x)
- GraphQL 16.11.0 (upgraded from 15.x)
- Modern testing setup with improved Prisma integration
