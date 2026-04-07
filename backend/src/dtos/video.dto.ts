import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

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
 *         font_size:
 *           type: number
 *         font_color:
 *           type: string
 *         border_color:
 *           type: string
 *         position:
 *           type: string
 *           enum: [top, middle, bottom]
 */

export class GenerateVideoDto {
  @IsString()
  @IsNotEmpty()
  quote_id!: string;

  @IsString()
  @IsNotEmpty()
  song_id!: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsNumber()
  font_size?: number;

  @IsOptional()
  @IsString()
  font_color?: string;

  @IsOptional()
  @IsString()
  border_color?: string;

  @IsOptional()
  @IsEnum(['top', 'middle', 'bottom'])
  position?: 'top' | 'middle' | 'bottom';

  @IsOptional()
  @IsEnum(['left', 'center', 'right'])
  text_align?: 'left' | 'center' | 'right';

  @IsOptional()
  @IsEnum(['9:16', '16:9'])
  aspect_ratio?: '9:16' | '16:9';
}
