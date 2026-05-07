import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { buildResponse } from '../utils/response';
import { testRunnerService } from '../services/test-runner.service';
import { BadRequestError } from '../utils/http-error';
import { smokeTestRequestSchema } from '../schemas/test.schema';
import env from '../config/env';

export const postSmokeTest = asyncHandler(async (req: Request, res: Response) => {
  const parsed = smokeTestRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new BadRequestError(JSON.stringify(parsed.error.errors));
  }

  const { target } = parsed.data;
  const result = await testRunnerService.runSmokeTest(target);

  const statusCode = result.passed ? 200 : 500;

  buildResponse.success(res, result, statusCode, {
    durationMs: result.durationMs,
    targetUrl: target === 'test-sites'
      ? env.SCRAPER_BASE_URL
      : env.SCRAPER_ECOMMERCE_URL,
  });
});
