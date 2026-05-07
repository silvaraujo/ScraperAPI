import { Router } from 'express';
import { postSmokeTest } from '../controllers/test.controller';

const router = Router();

/**
 * @swagger
 * /api/tests/smoke:
 *   post:
 *     summary: Run smoke tests on a target
 *     tags:
 *       - Tests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target
 *             properties:
 *               target:
 *                 type: string
 *                 enum: ['test-sites', 'ecommerce']
 *                 description: Test target
 *               headless:
 *                 type: boolean
 *                 default: true
 *                 description: Run browser in headless mode
 *     responses:
 *       200:
 *         description: Smoke test completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SmokeTestResult'
 *                 meta:
 *                   $ref: '#/components/schemas/Meta'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Test error
 */
router.post('/', postSmokeTest);

export default router;
