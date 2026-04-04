import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface QuoteMetadata {
  id?: string | undefined;
  text: string;
  author?: string | undefined;
  category?: string | undefined;
  source?: string | undefined;
  status?: string | undefined;
  video_status?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export class QuoteRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '');
  }

  async create(quote: QuoteMetadata): Promise<QuoteMetadata> {
    const { data, error } = await this.supabase
      .from('quotes')
      .insert([quote])
      .select()
      .single();

    if (error) throw new Error(`Supabase Create Quote Error: ${error.message}`);
    return data;
  }

  async findAll(): Promise<QuoteMetadata[]> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Supabase List Quotes Error: ${error.message}`);
    return data || [];
  }

  async findById(id: string): Promise<QuoteMetadata | null> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async findByStatus(status: string): Promise<QuoteMetadata[]> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Supabase FindByStatus Error: ${error.message}`);
    return data || [];
  }

  async findByVideoStatus(video_status: string): Promise<QuoteMetadata[]> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .eq('video_status', video_status)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Supabase FindByVideoStatus Error: ${error.message}`);
    return data || [];
  }

  async update(id: string, updates: Partial<QuoteMetadata>): Promise<QuoteMetadata> {
    const { data, error } = await this.supabase
      .from('quotes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Supabase Update Quote Error: ${error.message}`);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Supabase Delete Quote Error: ${error.message}`);
  }
}
