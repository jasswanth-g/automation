import { Interceptor } from 'routing-controllers';
import type { InterceptorInterface, Action } from 'routing-controllers';
import { Service } from 'typedi';

@Service()
@Interceptor()
export class ResponseInterceptor implements InterceptorInterface {
  intercept(action: Action, content: any) {
    // If content is already formatted (e.g., from an error middleware), return as is
    if (content && typeof content === 'object' && 'success' in content) {
      return content;
    }

    return {
      success: true,
      data: content,
    };
  }
}
