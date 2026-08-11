import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as templatesService from './templates.service';

export const listTemplatesHandler = asyncHandler(async (req: Request, res: Response) => {
  const templates = await templatesService.listTemplates(req.params.projectId);
  res.json({ templates });
});

export const createTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, items } = req.body;
  const template = await templatesService.createTemplate(
    req.params.projectId,
    name,
    description,
    items,
  );
  res.status(201).json({ template });
});

export const getTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  const template = await templatesService.getTemplate(req.params.templateId);
  res.json({ template });
});

export const updateTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  const template = await templatesService.updateTemplate(req.params.templateId, req.body);
  res.json({ template });
});

export const deleteTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  await templatesService.deleteTemplate(req.params.templateId);
  res.status(204).send();
});

export const instantiateTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await templatesService.instantiateTemplate(
    req.params.templateId,
    req.params.projectId,
    req.user!.id,
    req.body.dueDateBase,
  );
  res.status(201).json({ tasks });
});
