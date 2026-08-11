import { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorHandler';

/**
 * Express `router.param` handler factory. Loads the resource identified by
 * the given URL param and 404s unless it belongs to `req.params.projectId`.
 * Prevents IDOR: without this, a member of Project A who knows/guesses an
 * id belonging to Project B could read/mutate B's resource through a
 * Project A-scoped route, since requireProjectMember only checks membership
 * in the project named in the URL, not in the resource actually targeted.
 */
export function verifyProjectScoped<T extends { projectId: string }>(
  getResource: (id: string) => Promise<T | null>,
  label: string,
) {
  return (req: Request, _res: Response, next: NextFunction, id: string) => {
    getResource(id)
      .then((resource) => {
        if (!resource || resource.projectId !== req.params.projectId) {
          next(new HttpError(404, `${label} not found`));
          return;
        }
        next();
      })
      .catch(next);
  };
}
