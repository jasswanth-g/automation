import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LocalJSONStore } from '../utils/local-storage.util.js';

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
  private supabase: SupabaseClient | null = null;
  private localStore: LocalJSONStore<MovieMetadata>;

  constructor() {
    this.localStore = new LocalJSONStore<MovieMetadata>('movies');
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY && process.env.USE_LOCAL_STORAGE !== 'true') {
      try {
        this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      } catch {
        this.supabase = null;
      }
    }
  }

  private isLocalStorage(): boolean {
    return process.env.USE_LOCAL_STORAGE === 'true' || !this.supabase;
  }

  async create(movie: MovieMetadata): Promise<MovieMetadata> {
    if (this.isLocalStorage()) {
      return await this.localStore.create(movie);
    }
    try {
      const { data, error } = await this.supabase!
        .from('movies')
        .insert([movie])
        .select()
        .single();

      if (error) throw new Error(`Supabase Create Error: ${error.message}`);
      return data;
    } catch (err) {
      console.warn('[MovieRepository] Supabase failed, falling back to local storage');
      return await this.localStore.create(movie);
    }
  }

  async findAll(): Promise<MovieMetadata[]> {
    if (this.isLocalStorage()) {
      return await this.localStore.findAll();
    }
    try {
      const { data, error } = await this.supabase!
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Supabase List Error: ${error.message}`);
      return data || [];
    } catch (err) {
      console.warn('[MovieRepository] Supabase failed, falling back to local storage');
      return await this.localStore.findAll();
    }
  }

  async findById(id: string): Promise<MovieMetadata | null> {
    if (this.isLocalStorage()) {
      return await this.localStore.findById(id);
    }
    try {
      const { data, error } = await this.supabase!
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    } catch (err) {
      return await this.localStore.findById(id);
    }
  }

  async update(id: string, updates: Partial<MovieMetadata>): Promise<MovieMetadata> {
    if (this.isLocalStorage()) {
      return await this.localStore.update(id, updates);
    }
    try {
      const { data, error } = await this.supabase!
        .from('movies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Supabase Update Error: ${error.message}`);
      return data;
    } catch (err) {
      console.warn('[MovieRepository] Supabase failed, falling back to local storage');
      return await this.localStore.update(id, updates);
    }
  }

  async delete(id: string): Promise<void> {
    if (this.isLocalStorage()) {
      await this.localStore.delete(id);
      return;
    }
    try {
      const { error } = await this.supabase!
        .from('movies')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Supabase Delete Error: ${error.message}`);
    } catch (err) {
      console.warn('[MovieRepository] Supabase failed, falling back to local storage');
      await this.localStore.delete(id);
    }
  }
}
