import { QuoteRepository, type QuoteMetadata } from '../repositories/quote.repository.js';
import colors from 'colors';

export class QuoteService {
  private quoteRepository: QuoteRepository;

  constructor() {
    this.quoteRepository = new QuoteRepository();
  }

  async createQuote(text: string, author?: string, category?: string, source: string = 'api'): Promise<QuoteMetadata> {
    try {
      console.log(colors.cyan(`[QuoteService] Creating quote from source: ${source}`));
      
      const result = await this.quoteRepository.create({
        text,
        author,
        category,
        source,
        status: 'created',
        video_status: 'pending'
      });
      
      console.log(colors.green(`[QuoteService] Successfully created quote: ${result.id}`));
      return result;
    } catch (error: any) {
      console.error(colors.red(`[QuoteService] Creation failed: ${error.message}`));
      throw new Error(`Failed to create quote: ${error.message}`);
    }
  }

  async getAllQuotes(): Promise<QuoteMetadata[]> {
    try {
      return await this.quoteRepository.findAll();
    } catch (error: any) {
      console.error(colors.red(`[QuoteService] Failed to fetch quotes: ${error.message}`));
      throw new Error(`Failed to retrieve quotes: ${error.message}`);
    }
  }

  async getQuoteById(id: string): Promise<QuoteMetadata> {
    try {
      const quote = await this.quoteRepository.findById(id);
      if (!quote) throw new Error('Quote not found');
      return quote;
    } catch (error: any) {
      console.error(colors.red(`[QuoteService] Failed to find quote ${id}: ${error.message}`));
      throw new Error(`Failed to find quote: ${error.message}`);
    }
  }

  async updateQuote(id: string, updates: Partial<QuoteMetadata>): Promise<QuoteMetadata> {
    try {
      const result = await this.quoteRepository.update(id, updates);
      console.log(colors.green(`[QuoteService] Successfully updated quote: ${id}`));
      return result;
    } catch (error: any) {
      console.error(colors.red(`[QuoteService] Update failed for ${id}: ${error.message}`));
      throw new Error(`Failed to update quote: ${error.message}`);
    }
  }

  async deleteQuote(id: string): Promise<void> {
    try {
      await this.quoteRepository.delete(id);
      console.log(colors.green(`[QuoteService] Successfully deleted quote: ${id}`));
    } catch (error: any) {
      console.error(colors.red(`[QuoteService] Deletion failed for ${id}: ${error.message}`));
      throw new Error(`Failed to delete quote: ${error.message}`);
    }
  }

  async getQuotesByStatus(status: string): Promise<QuoteMetadata[]> {
    try {
      return await this.quoteRepository.findByStatus(status);
    } catch (error: any) {
      console.error(colors.red(`[QuoteService] Failed to fetch quotes by status ${status}: ${error.message}`));
      throw new Error(`Failed to retrieve quotes by status: ${error.message}`);
    }
  }

  async getQuotesByVideoStatus(videoStatus: string): Promise<QuoteMetadata[]> {
    try {
      return await this.quoteRepository.findByVideoStatus(videoStatus);
    } catch (error: any) {
      console.error(colors.red(`[QuoteService] Failed to fetch quotes by video status ${videoStatus}: ${error.message}`));
      throw new Error(`Failed to retrieve quotes by video status: ${error.message}`);
    }
  }
}
