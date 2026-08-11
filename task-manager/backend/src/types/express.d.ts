import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      projectRole?: 'OWNER' | 'ADMIN' | 'MEMBER';
    }
  }
}

export {};
