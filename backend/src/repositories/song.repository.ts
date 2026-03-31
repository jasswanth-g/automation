import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config/config.json' with { type: 'json' };

export interface SongMetadata {
  id?: string;
  name: string;
  url: string;
  imagekit_file_id: string;
  duration?: number;
  created_at?: string;
  updated_at?: string;
}

export class SongRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
  }

  async create(song: SongMetadata): Promise<SongMetadata> {
    const { data, error } = await this.supabase
      .from('songs')
      .insert([song])
      .select()
      .single();

    if (error) throw new Error(`Supabase Create Error: ${error.message}`);
    return data;
  }

  async findAll(): Promise<SongMetadata[]> {
    const { data, error } = await this.supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Supabase List Error: ${error.message}`);
    return data || [];
  }

  async findById(id: string): Promise<SongMetadata | null> {
    const { data, error } = await this.supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async update(id: string, updates: Partial<SongMetadata>): Promise<SongMetadata> {
    const { data, error } = await this.supabase
      .from('songs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Supabase Update Error: ${error.message}`);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Supabase Delete Error: ${error.message}`);
  }
}
