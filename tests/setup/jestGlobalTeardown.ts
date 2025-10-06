import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

module.exports = async (): Promise<void> => {
  const container = (global as any)
    .__TESTCONTAINER__ as StartedPostgreSqlContainer;

  if (container) {
    console.log('🛑 Stopping test database container...');
    await container.stop();
    console.log('✅ Test database container stopped');
  }
};
