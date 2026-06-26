import { Router } from 'express';
import { postButtonCheck } from '../controllers/button-check.controller';

const router = Router();

/**
 * @swagger
 * /api/button-check/verify:
 *   post:
 *     summary: Verify if a button exists on a page
 *     tags:
 *       - Button Check
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pageUrl
 *               - buttonText
 *             properties:
 *               pageUrl:
 *                 type: string
 *                 format: uri
 *                 description: The URL of the page to analyze
 *                 example: https://confirmacao-entrega-propria.ifood.com.br/
 *               buttonText:
 *                 type: string
 *                 description: The text of the button to search for
 *                 example: Cheguei no local
 *     responses:
 *       200:
 *         description: Successfully analyzed page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     buttonFound:
 *                       type: boolean
 *                     pageUrl:
 *                       type: string
 *                     pageTitle:
 *                       type: string
 *                     targetButton:
 *                       type: object
 *                       properties:
 *                         text:
 *                           type: string
 *                         type:
 *                           type: string
 *                         visible:
 *                           type: boolean
 *                         enabled:
 *                           type: boolean
 *                     analysis:
 *                       type: object
 *                       properties:
 *                         inputCount:
 *                           type: number
 *                         buttonCount:
 *                           type: number
 *                         formCount:
 *                           type: number
 *                     details:
 *                       type: object
 *                       properties:
 *                         inputs:
 *                           type: array
 *                         buttons:
 *                           type: array
 *                         forms:
 *                           type: array
 *                         headings:
 *                           type: array
 *                 meta:
 *                   $ref: '#/components/schemas/Meta'
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Page analysis error
 */
router.post('/verify', postButtonCheck);

export default router;
