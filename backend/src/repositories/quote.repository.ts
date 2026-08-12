import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LocalJSONStore } from '../utils/local-storage.util.js';

export interface QuoteMetadata {
  id?: string | undefined;
  text: string;
  author?: string | undefined;
  category?: string | undefined;
  source?: string | undefined;
  status?: string | undefined;
  video_status?: string | undefined;
  video_url?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export class QuoteRepository {
  private supabase: SupabaseClient | null = null;
  private localStore: LocalJSONStore<QuoteMetadata>;

  constructor() {
    this.localStore = new LocalJSONStore<QuoteMetadata>('quotes');
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

  async create(quote: QuoteMetadata): Promise<QuoteMetadata> {
    if (this.isLocalStorage()) {
      return await this.localStore.create(quote);
    }
    try {
      const { data, error } = await this.supabase!
        .from('quotes')
        .insert([quote])
        .select()
        .single();

      if (error) throw new Error(`Supabase Create Quote Error: ${error.message}`);
      return data;
    } catch (err) {
      console.warn('[QuoteRepository] Supabase failed, falling back to local storage');
      return await this.localStore.create(quote);
    }
  }

  async findAll(): Promise<QuoteMetadata[]> {
    if (this.isLocalStorage()) {
      const quotes = await this.localStore.findAll();
      const videoStore = new LocalJSONStore<any>('videos');
      const videos = await videoStore.findAll();
      return quotes.map(quote => {
        const completedVideo = videos.find((v: any) => v.quote_id === quote.id && v.status === 'completed');
        return {
          ...quote,
          video_url: completedVideo?.url || quote.video_url
        };
      });
    }
    try {
      const { data, error } = await this.supabase!
        .from('quotes')
        .select('*, videos!left(url, status)')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Supabase List Quotes Error: ${error.message}`);
      
      return (data || []).map((quote: any) => {
        const completedVideo = quote.videos?.find((v: any) => v.status === 'completed');
        return {
          ...quote,
          video_url: completedVideo?.url
        };
      });
    } catch (err) {
      console.warn('[QuoteRepository] Supabase failed, falling back to local storage');
      return await this.localStore.findAll();
    }
  }

  async findById(id: string): Promise<QuoteMetadata | null> {
    if (this.isLocalStorage()) {
      return await this.localStore.findById(id);
    }
    try {
      const { data, error } = await this.supabase!
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    } catch (err) {
      return await this.localStore.findById(id);
    }
  }

  async findByStatus(status: string): Promise<QuoteMetadata[]> {
    if (this.isLocalStorage()) {
      return await this.localStore.findByField('status', status);
    }
    try {
      const { data, error } = await this.supabase!
        .from('quotes')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Supabase FindByStatus Error: ${error.message}`);
      return data || [];
    } catch (err) {
      return await this.localStore.findByField('status', status);
    }
  }

  async findByVideoStatus(video_status: string): Promise<QuoteMetadata[]> {
    if (this.isLocalStorage()) {
      return await this.localStore.findByField('video_status', video_status);
    }
    try {
      const { data, error } = await this.supabase!
        .from('quotes')
        .select('*')
        .eq('video_status', video_status)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Supabase FindByVideoStatus Error: ${error.message}`);
      return data || [];
    } catch (err) {
      return await this.localStore.findByField('video_status', video_status);
    }
  }

  async update(id: string, updates: Partial<QuoteMetadata>): Promise<QuoteMetadata> {
    if (this.isLocalStorage()) {
      return await this.localStore.update(id, updates);
    }
    try {
      const { data, error } = await this.supabase!
        .from('quotes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Supabase Update Quote Error: ${error.message}`);
      return data;
    } catch (err) {
      console.warn('[QuoteRepository] Supabase failed, falling back to local storage');
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
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Supabase Delete Quote Error: ${error.message}`);
    } catch (err) {
      console.warn('[QuoteRepository] Supabase failed, falling back to local storage');
      await this.localStore.delete(id);
    }
  }
}
