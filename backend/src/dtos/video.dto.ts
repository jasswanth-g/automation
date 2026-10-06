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
  @IsOptional()
  @IsString()
  quote_id?: string;

  @IsString()
  @IsNotEmpty()
  song_id!: string;

  @IsOptional()
  @IsString()
  image_base64?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

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
  h_position?: 'left' | 'center' | 'right';

  @IsOptional()
  @IsString()
  font_family?: string;

  @IsOptional()
  @IsString()
  font_style?: string;

  @IsOptional()
  @IsEnum(['9:16', '16:9'])
  aspect_ratio?: '9:16' | '16:9';

  @IsOptional()
  @IsNumber()
  audio_start_time?: number;

  @IsOptional()
  @IsNumber()
  audio_end_time?: number;

  @IsOptional()
  @IsNumber()
  fade_in_duration?: number;

  @IsOptional()
  @IsNumber()
  fade_out_duration?: number;

  @IsOptional()
  @IsNumber()
  audio_fade_in?: number;

  @IsOptional()
  @IsNumber()
  audio_fade_out?: number;

  @IsOptional()
  @IsNumber()
  video_fade_in?: number;

  @IsOptional()
  @IsNumber()
  video_fade_out?: number;
}
