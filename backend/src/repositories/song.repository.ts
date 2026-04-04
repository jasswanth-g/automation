import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SongMetadata {
  id?: string | undefined;
  movie_id?: string | undefined;
  name: string;
  url: string;
  imagekit_file_id: string;
  duration?: number | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export class SongRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '');
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

  async findByMovieId(movieId: string): Promise<SongMetadata[]> {
    const { data, error } = await this.supabase
      .from('songs')
      .select('*')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Supabase List By Movie Error: ${error.message}`);
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
