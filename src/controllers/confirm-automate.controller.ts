import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { buildResponse } from '../utils/response';
import { food99ConfirmService } from '../services/99food-automate.service';
import { ifoodConfirmService } from '../services/ifood-automate.service';

import { BadRequestError } from '../utils/http-error';
import { ConfirmationResult } from '../types/confirmAutomate.types';
import env from '../config/env';

export const postConfirmAutomate = asyncHandler(async (req: Request, res: Response) => {
  const { source, locator, orderCode, orderId, shopId } = req.body;
  const startTime = Date.now();

  const integrations: Record<string, { service: any; url: string }> = {
    '99food': {
      service: food99ConfirmService,
      url: env.AUTOMATE_99FOOD_URL
    },
    'ifood': {
      service: ifoodConfirmService,
      url: env.AUTOMATE_IFOOD_URL
    }
  };

  const integration = integrations[source as string];
  if (!integration) {
    throw new BadRequestError('Fonte de automação inválida');
  }

  const result: ConfirmationResult = await integration.service.verifyOrderCode(locator, orderCode, orderId, shopId);

  if (!result.success) {
    return buildResponse.error(res, result.error || 'Não foi possível validar o pedido', 422);
  }

  return buildResponse.success(res, result, 200, {
    durationMs: Date.now() - startTime,
    source,
    targetUrl: integration.url,
  });
});
