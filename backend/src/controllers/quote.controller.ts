import { Get, Post, Patch, Delete, Controller, Body, Param, OnUndefined, NotFoundError, QueryParam } from 'routing-controllers';
import { Service } from 'typedi';
import { QuoteService } from '../services/quote.service.js';
import { CreateQuoteDto, UpdateQuoteDto } from '../dtos/quote.dto.js';

const quoteService = new QuoteService();

@Service()
@Controller('/api/quotes')
export class QuoteController {
  /**
   * @openapi
   * /api/quotes:
   *   post:
   *     summary: Create a new quote
   *     tags: [Quotes]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateQuoteDto'
   *     responses:
   *       201:
   *         description: Quote created successfully
   */
  @Post('/')
  async createQuote(@Body() body: CreateQuoteDto) {
    return await quoteService.createQuote(body.text, body.author, body.category, body.source || 'api');
  }

  /**
   * @openapi
   * /api/quotes:
   *   get:
   *     summary: List all quotes
   *     tags: [Quotes]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [created, posted]
   *       - in: query
   *         name: video_status
   *         schema:
   *           type: string
   *           enum: [pending, created]
   *     responses:
   *       200:
   *         description: List of quotes
   */
  @Get('/')
  async getAllQuotes(
    @QueryParam('status') status?: string,
    @QueryParam('video_status') videoStatus?: string
  ) {
    if (status) return await quoteService.getQuotesByStatus(status);
    if (videoStatus) return await quoteService.getQuotesByVideoStatus(videoStatus);
    return await quoteService.getAllQuotes();
  }

  /**
   * @openapi
   * /api/quotes/{id}:
   *   get:
   *     summary: Get quote by ID
   *     tags: [Quotes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Quote details
   *       404:
   *         description: Quote not found
   */
  @Get('/:id')
  @OnUndefined(404)
  async getQuoteById(@Param('id') id: string) {
    const quote = await quoteService.getQuoteById(id);
    if (!quote) throw new NotFoundError('Quote not found');
    return quote;
  }

  /**
   * @openapi
   * /api/quotes/{id}:
   *   patch:
   *     summary: Update quote (status, text, etc.)
   *     tags: [Quotes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateQuoteDto'
   *     responses:
   *       200:
   *         description: Quote updated
   */
  @Patch('/:id')
  async updateQuote(@Param('id') id: string, @Body() body: UpdateQuoteDto) {
    return await quoteService.updateQuote(id, body);
  }

  /**
   * @openapi
   * /api/quotes/{id}:
   *   delete:
   *     summary: Delete quote
   *     tags: [Quotes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Quote deleted
   */
  @Delete('/:id')
  @OnUndefined(204)
  async deleteQuote(@Param('id') id: string) {
    await quoteService.deleteQuote(id);
  }
}
