// Express 4 does not natively catch async errors in route handlers.
// This utility monkey-patches Layer.prototype.handle_request to catch rejected promises
// and route them automatically to Express next(err) error middleware.
// @ts-ignore
import Layer from 'express/lib/router/layer.js';

const originalHandle = (Layer as any).prototype.handle_request;

(Layer as any).prototype.handle_request = function (req: any, res: any, next: any) {
  const fn = this.handle;
  if (fn.length > 3) {
    return originalHandle.call(this, req, res, next);
  }
  try {
    const result = fn.call(this, req, res, next);
    if (result && typeof result.then === 'function') {
      result.catch(next);
    }
  } catch (err) {
    next(err);
  }
};
