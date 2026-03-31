import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBase64 } from 'class-validator';

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateSongDto:
 *       type: object
 *       required:
 *         - name
 *         - base64
 *       properties:
 *         name:
 *           type: string
 *         movie_id:
 *           type: string
 *           format: uuid
 *         base64:
 *           type: string
 *     UpdateSongDto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         movie_id:
 *           type: string
 *           format: uuid
 *         base64:
 *           type: string
 */

export class CreateSongDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  @IsUUID()
  movie_id?: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64({}, { message: 'Invalid Base64 string' })
  base64!: string;
}

export class UpdateSongDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsUUID()
  movie_id?: string;

  @IsString()
  @IsOptional()
  @IsBase64({}, { message: 'Invalid Base64 string' })
  base64?: string;
}
