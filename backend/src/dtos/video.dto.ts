import { IsString, IsNotEmpty } from 'class-validator';

/**
 * @openapi
 * components:
 *   schemas:
 *     GenerateVideoDto:
 *       type: object
 *       required:
 *         - quote_id
 *         - song_id
 *       properties:
 *         quote_id:
 *           type: string
 *         song_id:
 *           type: string
 */

export class GenerateVideoDto {
  @IsString()
  @IsNotEmpty()
  quote_id!: string;

  @IsString()
  @IsNotEmpty()
  song_id!: string;
}
