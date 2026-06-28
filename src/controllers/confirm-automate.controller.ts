import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { buildResponse } from '../utils/response';
import { food99ConfirmService } from '../services/99food-automate.service';
import { ifoodConfirmService } from '../services/ifood-automate.service';
import { ConfirmAutomateSchema } from '../schemas/confirmAutomate.schema';
import { BadRequestError } from '../utils/http-error';
import { ConfirmationResult } from '../types/confirmAutomate.types';

export const postConfirmAutomate = asyncHandler(async (req: Request, res: Response) => {
  const parsed = ConfirmAutomateSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new BadRequestError(JSON.stringify(parsed.error.errors));
  }

  const { source, locator, orderCode } = parsed.data;
  const startTime = Date.now();

  let result: ConfirmationResult;

  switch (source) {
    case '99food': {
      const result99 = await food99ConfirmService.verifyOrderCode(locator, orderCode);
      result = result99;
      break;
    }
    case 'ifood': {
      const resultIf = await ifoodConfirmService.verifyOrderCode(locator, orderCode);
      result = resultIf;
      break;
    }
    default:
      throw new BadRequestError('Fonte inválida');
  }

  if (!result.success) {
    return buildResponse.error(res, result.error || 'Erro ao analisar página', 500);
  }

  return buildResponse.success(res, result, 200, {
    durationMs: Date.now() - startTime,
    source: source,
  });
});
