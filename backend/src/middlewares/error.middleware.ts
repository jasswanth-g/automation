import { Middleware, HttpError } from 'routing-controllers';
import type { ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';
import type { Request, Response, NextFunction } from 'express';
import colors from 'colors';

@Service()
@Middleware({ type: 'after' })
export class ErrorMiddleware implements ExpressErrorMiddlewareInterface {
  error(error: any, request: Request, response: Response, next: NextFunction) {
    const status = error instanceof HttpError ? error.httpCode : 500;
    const message = error.message || 'An unexpected error occurred';

    console.error(colors.red(`[ErrorMiddleware] Error caught: ${message}`));
    if (error.stack) {
      console.error(colors.gray(error.stack));
    }

    response.status(status).json({
      success: false,
      message,
      // errors: error.errors || undefined, // For validation errors
    });
  }
}
