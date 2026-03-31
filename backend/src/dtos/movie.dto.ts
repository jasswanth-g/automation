import { IsString, IsNotEmpty, IsOptional, IsBase64 } from 'class-validator';

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateMovieDto:
 *       type: object
 *       required:
 *         - title
 *         - image_base64
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         image_base64:
 *           type: string
 *     UpdateMovieDto:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         image_base64:
 *           type: string
 */

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64({}, { message: 'Invalid Base64 string' })
  image_base64!: string;
}

export class UpdateMovieDto {
  @IsString()
  @IsOptional()
  @IsBase64({}, { message: 'Invalid Base64 string' })
  image_base64?: string;
}
