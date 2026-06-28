import { Router } from 'express';
import { postConfirmAutomate } from '../controllers/confirm-automate.controller';
import { validateSchema } from '../middlewares/validate.middleware';
import { ConfirmAutomateSchema } from '../schemas/confirmAutomate.schema';

const router = Router();

/**
 * @swagger
 * /api/automations/confirmations:
 *   post:
 *     summary: Executa o confirm-automate
 *     tags: [Automações]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmAutomateRequest'
 *     responses:
 *       200:
 *         description: "Sucesso. Retorna os dados da validação."
 *       400:
 *         description: "Erro de validação nos dados de entrada."
 *       422:
 *         description: "Erro de regra de negócio (ex: pedido não encontrado)."
 *       500:
 *         description: "Erro interno no servidor durante a automação."
 */
router.post('/confirmations', validateSchema(ConfirmAutomateSchema), postConfirmAutomate);

export default router;