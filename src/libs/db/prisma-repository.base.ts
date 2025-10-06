import { RequestContextService } from '@libs/application/context/AppRequestContext';
import { AggregateRoot, PaginatedQueryParams, Paginated } from '@libs/ddd';
import { Mapper } from '@libs/ddd';
import { RepositoryPort } from '@libs/ddd';
import { ConflictException } from '@libs/exceptions';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { None, Option, Some } from 'oxide.ts';
import { PrismaClient, Prisma } from '@prisma/client';
import { LoggerPort } from '../ports/logger.port';
import { ObjectLiteral } from '../types';

export abstract class PrismaRepositoryBase<
  Aggregate extends AggregateRoot<any>,
  DbModel extends ObjectLiteral,
> implements RepositoryPort<Aggregate>
{
  protected abstract tableName: string;

  protected constructor(
    protected readonly prisma: PrismaClient,
    protected readonly mapper: Mapper<Aggregate, DbModel>,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly logger: LoggerPort,
  ) {}

  async findOneById(id: string): Promise<Option<Aggregate>> {
    try {
      const result = await this.getDelegate().findUnique({
        where: { id },
      });

      return result ? Some(this.mapper.toDomain(result as DbModel)) : None;
    } catch (error) {
      this.logger.error(`Error finding entity by id ${id}:`, error);
      return None;
    }
  }

  async findAll(): Promise<Aggregate[]> {
    const results = await this.getDelegate().findMany();
    return results.map((result) => this.mapper.toDomain(result as DbModel));
  }

  async findAllPaginated(
    params: PaginatedQueryParams,
  ): Promise<Paginated<Aggregate>> {
    const [results, total] = await Promise.all([
      this.getDelegate().findMany({
        skip: params.offset,
        take: params.limit,
      }),
      this.getDelegate().count(),
    ]);

    const entities = results.map((result) =>
      this.mapper.toDomain(result as DbModel),
    );

    return new Paginated({
      data: entities,
      count: total,
      limit: params.limit,
      page: params.page,
    });
  }

  async delete(entity: Aggregate): Promise<boolean> {
    entity.validate();

    this.logger.debug(
      `[${RequestContextService.getRequestId()}] deleting entity ${
        entity.id
      } from ${this.tableName}`,
    );

    try {
      await this.getDelegate().delete({
        where: { id: entity.id },
      });

      await entity.publishEvents(this.logger, this.eventEmitter);
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // Record not found
        return false;
      }
      throw error;
    }
  }

  /**
   * Inserts an entity to a database
   * (also publishes domain events and waits for completion)
   */
  async insert(entity: Aggregate | Aggregate[]): Promise<void> {
    const entities = Array.isArray(entity) ? entity : [entity];

    const records = entities.map(this.mapper.toPersistence);

    try {
      if (entities.length === 1) {
        await this.writeQuery(
          () => this.getDelegate().create({ data: records[0] }),
          entities[0],
        );
      } else {
        await this.writeQuery(
          () => this.getDelegate().createMany({ data: records }),
          entities,
        );
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.debug(
          `[${RequestContextService.getRequestId()}] Unique constraint violation: ${
            error.message
          }`,
        );
        throw new ConflictException('Record already exists', error);
      }
      throw error;
    }
  }

  /**
   * Utility method for write queries when you need to mutate an entity.
   * Executes entity validation, publishes events,
   * and does some debug logging.
   */
  protected async writeQuery<T>(
    operation: () => Promise<T>,
    entity: Aggregate | Aggregate[],
  ): Promise<T> {
    const entities = Array.isArray(entity) ? entity : [entity];
    entities.forEach((entity) => entity.validate());
    const entityIds = entities.map((e) => e.id);

    this.logger.debug(
      `[${RequestContextService.getRequestId()}] writing ${
        entities.length
      } entities to "${this.tableName}" table: ${entityIds}`,
    );

    const result = await operation();

    await Promise.all(
      entities.map((entity) =>
        entity.publishEvents(this.logger, this.eventEmitter),
      ),
    );

    return result;
  }

  /**
   * start a global transaction to save
   * results of all event handlers in one operation
   */
  public async transaction<T>(handler: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      this.logger.debug(
        `[${RequestContextService.getRequestId()}] transaction started`,
      );

      if (!RequestContextService.getTransactionConnection()) {
        RequestContextService.setTransactionConnection(tx as any);
      }

      try {
        const result = await handler();
        this.logger.debug(
          `[${RequestContextService.getRequestId()}] transaction committed`,
        );
        return result;
      } catch (e) {
        this.logger.debug(
          `[${RequestContextService.getRequestId()}] transaction aborted`,
        );
        throw e;
      } finally {
        RequestContextService.cleanTransactionConnection();
      }
    });
  }

  /**
   * Get the appropriate Prisma delegate for the current table
   * This should be implemented by concrete repository classes
   */
  protected abstract getDelegate(): any;

  /**
   * Get Prisma client instance.
   * If global request transaction is started,
   * returns the transaction client.
   */
  protected get client(): PrismaClient {
    return (
      RequestContextService.getContext().transactionConnection ?? this.prisma
    );
  }
}
