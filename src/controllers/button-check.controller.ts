import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { buildResponse } from '../utils/response';
import { buttonCheckService } from '../services/button-check.service';
import { BadRequestError } from '../utils/http-error';
import { buttonCheckRequestSchema } from '../schemas/button-check.schema';

export const postButtonCheck = asyncHandler(async (req: Request, res: Response) => {
  const parsed = buttonCheckRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new BadRequestError(JSON.stringify(parsed.error.errors));
  }

  const { pageUrl, buttonText } = parsed.data;
  const startTime = Date.now();

  const result = await buttonCheckService.verifyButtonOnPage(pageUrl, buttonText);

  if (!result.success) {
    return buildResponse.error(res, result.error || 'Erro ao analisar página', 500);
  }

  return buildResponse.success(res, result, 200, {
    durationMs: Date.now() - startTime,
    targetUrl: pageUrl,
    buttonText,
  });
});
