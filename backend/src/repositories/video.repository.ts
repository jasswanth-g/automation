import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface VideoMetadata {
  id?: string;
  url?: string;
  imagekit_file_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  quote_id?: string;
  song_id?: string;
  created_at?: string;
  updated_at?: string;
}

export class VideoRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '');
  }

  async create(video: Partial<VideoMetadata>): Promise<VideoMetadata> {
    const { data, error } = await this.supabase
      .from('videos')
      .insert([video])
      .select()
      .single();

    if (error) throw new Error(`Supabase Create Video Error: ${error.message}`);
    return data;
  }

  async findById(id: string): Promise<VideoMetadata | null> {
    const { data, error } = await this.supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async findAll(): Promise<VideoMetadata[]> {
    const { data, error } = await this.supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Supabase List Videos Error: ${error.message}`);
    return data || [];
  }

  async update(id: string, updates: Partial<VideoMetadata>): Promise<VideoMetadata> {
    const { data, error } = await this.supabase
      .from('videos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Supabase Update Video Error: ${error.message}`);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Supabase Delete Video Error: ${error.message}`);
  }
}
