import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';

let postgresContainer: StartedPostgreSqlContainer;

module.exports = async (): Promise<void> => {
  console.log('🚀 Starting test database container...');

  // Start PostgreSQL container
  postgresContainer = await new PostgreSqlContainer('postgres:15-alpine')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_password')
    .withExposedPorts(5432)
    .start();

  const connectionString = postgresContainer.getConnectionUri();

  // Set environment variable for Prisma
  process.env.DATABASE_URL = connectionString;

  console.log('✅ Test database container started');
  console.log('📦 Connection:', connectionString);

  // Run Prisma migrations
  console.log('🔄 Running Prisma migrations...');
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: connectionString },
      stdio: 'inherit',
    });
    console.log('✅ Migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  // Store container info globally for teardown
  (global as any).__TESTCONTAINER__ = postgresContainer;
};
