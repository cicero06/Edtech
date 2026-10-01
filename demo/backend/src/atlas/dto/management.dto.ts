import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateWorkspaceDto {
  @IsIn(['SCHOOL', 'PILOT'])
  kind!: 'SCHOOL' | 'PILOT';

  @IsString()
  @Length(1, 120)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  province?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  district?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  mebCode?: string;
}

export class CreateGroupDto {
  @IsString()
  @Length(1, 80)
  name!: string;
}

export class CreateParticipantDto {
  @IsString()
  @Length(1, 60)
  displayName!: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  avatar?: string;
}

export class CreateActivityDto {
  @IsString()
  @Length(1, 120)
  title!: string;

  @IsString()
  @Length(1, 60)
  scenario!: string;

  @IsString()
  @Length(1, 40)
  version!: string;

  @IsOptional()
  @IsObject()
  manifest?: Record<string, unknown>;
}
