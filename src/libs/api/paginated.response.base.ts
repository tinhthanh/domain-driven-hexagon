import { ApiProperty } from '@nestjs/swagger';
import { Paginated } from '../ddd';

export abstract class PaginatedResponseDto<T> extends Paginated<T> {
  @ApiProperty({
    example: 5312,
    description: 'Total number of items',
  })
  declare readonly count: number;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
  })
  declare readonly limit: number;

  @ApiProperty({ example: 0, description: 'Page number' })
  declare readonly page: number;

  @ApiProperty({ isArray: true })
  abstract readonly data: readonly T[];
}
