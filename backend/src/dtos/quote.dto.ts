import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateQuoteDto:
 *       type: object
 *       required:
 *         - text
 *       properties:
 *         text:
 *           type: string
 *         author:
 *           type: string
 *         category:
 *           type: string
 *         source:
 *           type: string
 *     UpdateQuoteDto:
 *       type: object
 *       properties:
 *         text:
 *           type: string
 *         author:
 *           type: string
 *         category:
 *           type: string
 *         status:
 *           type: string
 *           enum: [created, posted]
 *         video_status:
 *           type: string
 *           enum: [pending, created]
 */

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  source?: string;
}

export class UpdateQuoteDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsOptional()
  @IsEnum(['created', 'posted'])
  status?: string;

  @IsOptional()
  @IsEnum(['pending', 'created'])
  video_status?: string;
}
