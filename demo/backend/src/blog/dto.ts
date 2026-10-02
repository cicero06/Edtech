import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Mirrors the site's PostBlock union: exactly one of h | p | ul per block. */
export class PostBlockDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  h?: string;

  @IsOptional()
  @IsString()
  @Length(1, 8000)
  p?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  ul?: string[];
}

export class UpsertBlogPostDto {
  @IsString()
  @Length(3, 200)
  title: string;

  @IsString()
  @Length(1, 60)
  tag: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  displayDate?: string;

  @IsString()
  @Length(10, 500)
  excerpt: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be kebab-case (a-z, 0-9, dashes)',
  })
  slug?: string;

  @IsArray()
  @ArrayMaxSize(120)
  @ValidateNested({ each: true })
  @Type(() => PostBlockDto)
  body: PostBlockDto[];

  /** Publish immediately instead of saving a draft. */
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}
