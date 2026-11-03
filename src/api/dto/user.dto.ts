import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'user1@teploshchit.local' })
  email!: string;

  @ApiProperty({ example: 'Анна Смирнова', maxLength: 100 })
  displayName!: string;

  @ApiProperty({ example: 'Teplo123!', minLength: 8, maxLength: 128 })
  password!: string;
}

export class AuthenticateUserDto {
  @ApiProperty({ example: 'user1@teploshchit.local' })
  email!: string;

  @ApiProperty({ example: 'Teplo123!' })
  password!: string;
}
