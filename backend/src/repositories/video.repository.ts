import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LocalJSONStore } from '../utils/local-storage.util.js';

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
  private supabase: SupabaseClient | null = null;
  private localStore: LocalJSONStore<VideoMetadata>;

  constructor() {
    this.localStore = new LocalJSONStore<VideoMetadata>('videos');
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

  async create(video: Partial<VideoMetadata>): Promise<VideoMetadata> {
    if (this.isLocalStorage()) {
      return await this.localStore.create(video);
    }
    try {
      const { data, error } = await this.supabase!
        .from('videos')
        .insert([video])
        .select()
        .single();

      if (error) throw new Error(`Supabase Create Video Error: ${error.message}`);
      return data;
    } catch (err) {
      console.warn('[VideoRepository] Supabase failed, falling back to local storage');
      return await this.localStore.create(video);
    }
  }

  async findById(id: string): Promise<VideoMetadata | null> {
    if (this.isLocalStorage()) {
      return await this.localStore.findById(id);
    }
    try {
      const { data, error } = await this.supabase!
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    } catch (err) {
      return await this.localStore.findById(id);
    }
  }

  async findAll(): Promise<VideoMetadata[]> {
    if (this.isLocalStorage()) {
      return await this.localStore.findAll();
    }
    try {
      const { data, error } = await this.supabase!
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Supabase List Videos Error: ${error.message}`);
      return data || [];
    } catch (err) {
      console.warn('[VideoRepository] Supabase failed, falling back to local storage');
      return await this.localStore.findAll();
    }
  }

  async update(id: string, updates: Partial<VideoMetadata>): Promise<VideoMetadata> {
    if (this.isLocalStorage()) {
      return await this.localStore.update(id, updates);
    }
    try {
      const { data, error } = await this.supabase!
        .from('videos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Supabase Update Video Error: ${error.message}`);
      return data;
    } catch (err) {
      console.warn('[VideoRepository] Supabase failed, falling back to local storage');
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
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Supabase Delete Video Error: ${error.message}`);
    } catch (err) {
      console.warn('[VideoRepository] Supabase failed, falling back to local storage');
      await this.localStore.delete(id);
    }
  }
}
