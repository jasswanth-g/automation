import { Get, Controller } from 'routing-controllers';
import { Service } from 'typedi';

@Service()
@Controller()
export class VideoController {
  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Health Check
   *     tags:
   *       - General
   *     description: Returns the server health status
   *     responses:
   *       200:
   *         description: Success
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   */
  @Get('/health')
  getHealth() {
    return 'Server is running';
  }
}
