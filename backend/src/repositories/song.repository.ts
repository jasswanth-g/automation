import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LocalJSONStore } from '../utils/local-storage.util.js';

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
  private supabase: SupabaseClient | null = null;
  private localStore: LocalJSONStore<SongMetadata>;

  constructor() {
    this.localStore = new LocalJSONStore<SongMetadata>('songs');
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

  async create(song: SongMetadata): Promise<SongMetadata> {
    if (this.isLocalStorage()) {
      return await this.localStore.create(song);
    }
    try {
      const { data, error } = await this.supabase!
        .from('songs')
        .insert([song])
        .select()
        .single();

      if (error) throw new Error(`Supabase Create Error: ${error.message}`);
      return data;
    } catch (err) {
      console.warn('[SongRepository] Supabase failed, falling back to local storage');
      return await this.localStore.create(song);
    }
  }

  async findAll(): Promise<SongMetadata[]> {
    if (this.isLocalStorage()) {
      return await this.localStore.findAll();
    }
    try {
      const { data, error } = await this.supabase!
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Supabase List Error: ${error.message}`);
      return data || [];
    } catch (err) {
      console.warn('[SongRepository] Supabase failed, falling back to local storage');
      return await this.localStore.findAll();
    }
  }

  async findByMovieId(movieId: string): Promise<SongMetadata[]> {
    if (this.isLocalStorage()) {
      return await this.localStore.findByField('movie_id', movieId);
    }
    try {
      const { data, error } = await this.supabase!
        .from('songs')
        .select('*')
        .eq('movie_id', movieId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(`Supabase List By Movie Error: ${error.message}`);
      return data || [];
    } catch (err) {
      return await this.localStore.findByField('movie_id', movieId);
    }
  }

  async findById(id: string): Promise<SongMetadata | null> {
    if (this.isLocalStorage()) {
      return await this.localStore.findById(id);
    }
    try {
      const { data, error } = await this.supabase!
        .from('songs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    } catch (err) {
      return await this.localStore.findById(id);
    }
  }

  async update(id: string, updates: Partial<SongMetadata>): Promise<SongMetadata> {
    if (this.isLocalStorage()) {
      return await this.localStore.update(id, updates);
    }
    try {
      const { data, error } = await this.supabase!
        .from('songs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Supabase Update Error: ${error.message}`);
      return data;
    } catch (err) {
      console.warn('[SongRepository] Supabase failed, falling back to local storage');
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
        .from('songs')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Supabase Delete Error: ${error.message}`);
    } catch (err) {
      console.warn('[SongRepository] Supabase failed, falling back to local storage');
      await this.localStore.delete(id);
    }
  }
}
