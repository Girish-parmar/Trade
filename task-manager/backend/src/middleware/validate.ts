import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({ body: req.body, params: req.params, query: req.query });
      req.body = parsed.body ?? req.body;
      next();
    } catch (err) {
      next(err);
    }
  };
}
