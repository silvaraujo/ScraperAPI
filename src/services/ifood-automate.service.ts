import { Page } from 'playwright';
import logger from '../config/logger';
import { browserService } from './browser.service';
import { ConfirmationResult } from '../types/confirmAutomate.types';
import env from '../config/env';
import { scrapeVisibleTexts } from '../utils/dom-scraper';

export class IfoodConfirmService {
  async verifyOrderCode(
    localizer: string,
    code: string,
  ): Promise<ConfirmationResult> {
    let page: Page | null = null;

    try {
      await browserService.initialize();
      page = await browserService.createPage();

      logger.info(`Confirmando code no ifood: ${code} no localizador: "${localizer}"`);
      const pageUrl = env.AUTOMATE_IFOOD_URL;

      // domcontentloaded é mais confiável que networkidle em SPAs com polling/websockets
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

      // Aguarda até que existam exatamente 8 campos de telefone na tela (evita race conditions)
      await page.waitForFunction(
        () => document.querySelectorAll('input[type="tel"]').length === 8,
        { timeout: 15000 }
      );

      const inputs = page.locator('input[type="tel"]');
      const inputCount = await inputs.count();
      logger.info(`Inputs encontrados na tela inicial: ${inputCount}`);

      const digitos = localizer.split('');
      for (let i = 0; i < inputCount; i++) {
        await inputs.nth(i).fill(digitos[i]);
      }
      logger.info(`Localizador preenchido "${localizer}" na página`);

      // Clica em Continuar com auto-waiting do Playwright
      const botaoContinuar = page.locator('button, [type="submit"]').filter({ hasText: /continuar/i }).first();
      await botaoContinuar.click({ timeout: 10000 });
      logger.info(`Botão "Continuar" clicado na página`);

      // Aguarda a tela mudar: espera que existam exatamente 4 inputs
      await page.waitForFunction(
        () => document.querySelectorAll('input[type="tel"]').length === 4,
        { timeout: 15000 }
      );

      const inputsAtuais = page.locator('input[type="tel"]');
      const countAtual = await inputsAtuais.count();
      logger.info(`Inputs encontrados na tela de código: ${countAtual}`);

      logger.info(`📝 Inserindo código de segurança: ${code}\n`);
      const codeDigits = code.split('');

      for (let i = 0; i < 4; i++) {
        await inputsAtuais.nth(i).fill(codeDigits[i]);
      }

      // Clica em Continuar novamente
      const botaoFinal = page.locator('button, [type="submit"]').filter({ hasText: /continuar/i }).first();
      await botaoFinal.click({ timeout: 10000 });
      logger.info(`Botão "Continuar" clicado após inserir o código de segurança`);

      // Aguarda o modal de erro (ActionSheet) OU a tela de sucesso (HandshakeResult__content)
      // Isso evita o timeout de 15 segundos quando o código é inserido corretamente e o modal de erro nunca aparece.
      await page.waitForSelector('[class*="ActionSheet__container"], .HandshakeResult__content', { timeout: 5000 })
        .catch(() => {
          logger.warn('Nenhum indicador de resultado (modal ou tela de sucesso) detectado em 5s — capturando textos da página assim mesmo');
        });

      logger.info('Resultado (sucesso ou erro) detectado — capturando textos');

      // Captura os textos visíveis dentro do modal de resultado ou do container de sucesso usando o helper utilitário
      const textosCapturados = await scrapeVisibleTexts(page, '.ActionSheet__container, .HandshakeResult__content');

      logger.info(`Textos capturados na tela final: ${textosCapturados.length}`);

      return {
        success: true,
        textosCapturados,
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error analyzing page: ${message}`);

      return {
        success: false,
        error: message,
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}

export const ifoodConfirmService = new IfoodConfirmService();
