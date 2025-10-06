# API Documentation

## Overview

This application provides multiple API interfaces:
- **REST API** - Traditional HTTP endpoints
- **GraphQL API** - Flexible query language
- **CLI Commands** - Command-line interface

## Base URLs

- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## Authentication

Currently, the API does not implement authentication. In production, you should add:
- JWT tokens
- API keys
- OAuth 2.0

## REST API

### Users

#### Get All Users

```http
GET /v1/users?page=1&limit=10&country=Vietnam
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `country` (optional) - Filter by country
- `postalCode` (optional) - Filter by postal code
- `street` (optional) - Filter by street

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "country": "Vietnam",
      "postalCode": "10000",
      "street": "123 Main St",
      "role": "user",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 10,
  "page": 1
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid query parameters)
- `500` - Internal Server Error

#### Create User

```http
POST /v1/users
Content-Type: application/json

{
  "email": "john@example.com",
  "country": "Vietnam",
  "postalCode": "10000",
  "street": "123 Main St"
}
```

**Request Body:**
- `email` (required) - Valid email address
- `country` (required) - Country name
- `postalCode` (required) - Postal code
- `street` (required) - Street address

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Bad Request (validation errors)
- `409` - Conflict (user already exists)
- `500` - Internal Server Error

#### Delete User

```http
DELETE /v1/users/{id}
```

**Path Parameters:**
- `id` (required) - User ID (UUID)

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Status Codes:**
- `200` - Deleted successfully
- `404` - User not found
- `500` - Internal Server Error

## GraphQL API

### Endpoint

```
POST /graphql
```

**Note**: This application uses **Apollo Server 5** with **GraphQL 16**. The GraphQL Playground is enabled in development mode.

### GraphQL Playground

Access the GraphQL Playground at:
```
http://localhost:3000/graphql
```

The playground provides:
- Interactive query/mutation editor
- Schema documentation
- Query history
- Auto-completion

### Schema

#### Types

```graphql
type User {
  id: ID!
  email: String!
  country: String!
  postalCode: String!
  street: String!
  role: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type PaginatedUsers {
  data: [User!]!
  count: Int!
  limit: Int!
  page: Int!
}

input CreateUserInput {
  email: String!
  country: String!
  postalCode: String!
  street: String!
}

input FindUsersInput {
  page: Int = 1
  limit: Int = 10
  country: String
  postalCode: String
  street: String
}
```

#### Queries

```graphql
type Query {
  users(input: FindUsersInput): PaginatedUsers!
  user(id: ID!): User
}
```

**Example Query:**
```graphql
query GetUsers($input: FindUsersInput) {
  users(input: $input) {
    data {
      id
      email
      country
      postalCode
      street
    }
    count
    limit
    page
  }
}
```

**Variables:**
```json
{
  "input": {
    "page": 1,
    "limit": 10,
    "country": "Vietnam"
  }
}
```

#### Mutations

```graphql
type Mutation {
  createUser(input: CreateUserInput!): User!
  deleteUser(id: ID!): User!
}
```

**Example Mutation:**
```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
    country
    postalCode
    street
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "john@example.com",
    "country": "Vietnam",
    "postalCode": "10000",
    "street": "123 Main St"
  }
}
```

### GraphQL Playground

Access the GraphQL Playground at:
```
http://localhost:3000/graphql
```

## CLI Commands

### Create User

```bash
npm run cli new:user <email> <country> <postalCode> <street>
```

**Example:**
```bash
npm run cli new:user "john@example.com" "Vietnam" "10000" "123 Main St"
```

**Output:**
```
User created successfully with ID: 550e8400-e29b-41d4-a716-446655440000
```

## Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email"
    }
  ]
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `422` - Unprocessable Entity (business logic error)
- `500` - Internal Server Error

## Rate Limiting

Currently not implemented. In production, consider:
- Rate limiting per IP address
- Rate limiting per user
- Different limits for different endpoints

## Swagger Documentation

Access the Swagger UI at:
```
http://localhost:3000/api
```

The Swagger documentation provides:
- Interactive API explorer
- Request/response schemas
- Example requests
- Authentication details

## Postman Collection

Import the Postman collection for easy API testing:
```json
{
  "info": {
    "name": "Domain-Driven Hexagon API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Users",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/v1/users?page=1&limit=10",
          "host": ["{{baseUrl}}"],
          "path": ["v1", "users"],
          "query": [
            {"key": "page", "value": "1"},
            {"key": "limit", "value": "10"}
          ]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

## Testing the API

### Using cURL

```bash
# Get users
curl -X GET "http://localhost:3000/v1/users" \
  -H "accept: application/json"

# Create user
curl -X POST "http://localhost:3000/v1/users" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "country": "Vietnam",
    "postalCode": "10000",
    "street": "Test Street"
  }'

# Delete user
curl -X DELETE "http://localhost:3000/v1/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "accept: application/json"
```

### Using HTTPie

```bash
# Get users
http GET localhost:3000/v1/users page==1 limit==10

# Create user
http POST localhost:3000/v1/users \
  email=test@example.com \
  country=Vietnam \
  postalCode=10000 \
  street="Test Street"

# Delete user
http DELETE localhost:3000/v1/users/550e8400-e29b-41d4-a716-446655440000
```
