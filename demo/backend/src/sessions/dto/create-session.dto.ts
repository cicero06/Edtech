import { Equals, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @Equals('water-crisis')
  scenarioId!: string;
}
