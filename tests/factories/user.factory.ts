import { CreateUserRequestDto } from '@src/modules/user/commands/create-user/create-user.request.dto';

export class UserFactory {
  private static counter = 0;

  static createUserDto(
    overrides: Partial<CreateUserRequestDto> = {},
  ): CreateUserRequestDto {
    this.counter++;

    const streets = [
      'Main Street',
      'Second Avenue',
      'Park Boulevard',
      'Oak Street',
      'Maple Avenue',
      'Cedar Lane',
      'Pine Street',
      'Elm Avenue',
    ];

    return {
      email: overrides.email || `user${this.counter}@example.com`,
      country: overrides.country || 'Vietnam',
      postalCode: overrides.postalCode || '10000',
      street: overrides.street || streets[this.counter % streets.length],
    };
  }

  static createManyUserDtos(
    count: number,
    overrides: Partial<CreateUserRequestDto> = {},
  ): CreateUserRequestDto[] {
    return Array.from({ length: count }, (_, index) => {
      const dto = this.createUserDto(overrides);
      // Ensure unique emails for each user
      if (!overrides.email) {
        return {
          ...dto,
          email: `user${this.counter - count + index + 1}@example.com`,
        };
      }
      return dto;
    });
  }

  static reset(): void {
    this.counter = 0;
  }
}
