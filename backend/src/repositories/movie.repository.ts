import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface MovieMetadata {
  id?: string | undefined;
  title: string;
  description?: string | undefined;
  image_url: string;
  imagekit_file_id: string;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export class MovieRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '');
  }

  async create(movie: MovieMetadata): Promise<MovieMetadata> {
    const { data, error } = await this.supabase
      .from('movies')
      .insert([movie])
      .select()
      .single();

    if (error) throw new Error(`Supabase Create Error: ${error.message}`);
    return data;
  }

  async findAll(): Promise<MovieMetadata[]> {
    const { data, error } = await this.supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Supabase List Error: ${error.message}`);
    return data || [];
  }

  async findById(id: string): Promise<MovieMetadata | null> {
    const { data, error } = await this.supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async update(id: string, updates: Partial<MovieMetadata>): Promise<MovieMetadata> {
    const { data, error } = await this.supabase
      .from('movies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Supabase Update Error: ${error.message}`);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('movies')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Supabase Delete Error: ${error.message}`);
  }
}
