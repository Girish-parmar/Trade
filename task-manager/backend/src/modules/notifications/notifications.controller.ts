import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as notificationsService from './notifications.service';

export const listNotificationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const unreadOnly = req.query.unread === 'true';
  const notifications = await notificationsService.listNotifications(req.user!.id, unreadOnly);
  res.json({ notifications });
});

export const markReadHandler = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markRead(req.user!.id, req.params.id);
  res.status(204).send();
});

export const markAllReadHandler = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markAllRead(req.user!.id);
  res.status(204).send();
});
