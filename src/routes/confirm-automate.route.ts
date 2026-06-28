import { Router } from 'express';
import { postConfirmAutomate } from '../controllers/confirm-automate.controller';

const router = Router();

/**
 * @swagger
 * /api/confirmAction:
 *   post:
 *     summary: Executa o confirm-automate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - source
 *               - locator
 *               - orderCode
 *             properties:
 *               source:
 *                 type: string
 *                 enum: ["99food", "ifood"]
 *                 example: "ifood"
 *               locator:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 8
 *                 example: "26893427"
 *               orderCode:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 4
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Sucesso
 */
router.post('/executar', postConfirmAutomate);

export default router;