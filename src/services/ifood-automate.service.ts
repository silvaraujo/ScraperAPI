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

      // Usa Promise.race para detectar qual outcome ocorreu primeiro.
      // Os data-testid são estáveis e não dependem de classes geradas dinamicamente.
      type Outcome = 'passo2' | 'sucesso' | 'erro-codigo' | 'cancelado' | 'timeout';

      const SELETORES: Record<Exclude<Outcome, 'passo2' | 'timeout'>, string> = {
        'sucesso':     '.HandshakeResult__content',
        'erro-codigo': '[data-testid="wrong-handshake-modal"]',
        'cancelado':   '[data-testid="cancelled-order-modal"]',
      };

      // ── Passo 1 → transição ──────────────────────────────────────────────────
      // Race entre "4 inputs aparecem" (fluxo normal) e modais de erro precoce.
      // Se o pedido estiver cancelado, o modal aparece aqui — antes do passo 2.
      const transicaoPasso1 = await Promise.race([
        page.waitForFunction(
          () => document.querySelectorAll('input[type="tel"]').length === 4,
          { timeout: 15000 }
        ).then(() => 'passo2' as Outcome),
        ...( Object.entries(SELETORES) as [Outcome, string][] ).map(([nome, seletor]) =>
          page!.waitForSelector(seletor, { state: 'visible', timeout: 15000 })
            .then(() => nome)
        ),
      ]);

      logger.info(`Transição após passo 1: "${transicaoPasso1}"`);

      // Se um modal de resultado já apareceu no passo 1, captura e retorna agora.
      if (transicaoPasso1 !== 'passo2') {
        const seletorEarly = SELETORES[transicaoPasso1 as Exclude<Outcome, 'passo2' | 'timeout'>];
        const textosCapturados = await scrapeVisibleTexts(page, seletorEarly);
        logger.info(`Resultado detectado no passo 1 ("${transicaoPasso1}") — textos: ${textosCapturados.length}`);
        return { success: true, textosCapturados };
      }

      // ── Passo 2: inserção do código de segurança ─────────────────────────────
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

      // Usa Promise.race para detectar qual outcome ocorreu primeiro.
      // Os data-testid são estáveis e não dependem de classes geradas dinamicamente.
      // (reutiliza o objeto SELETORES já declarado no início da função)

      let outcome: Outcome = 'timeout';
      let seletorDetectado: string | undefined = undefined;

      try {
        outcome = await Promise.race(
          (Object.entries(SELETORES) as [Outcome, string][]).map(([nome, seletor]) =>
            page!.waitForSelector(seletor, { state: 'visible', timeout: 10000 })
              .then(() => nome)
          )
        );
        seletorDetectado = SELETORES[outcome as Exclude<Outcome, 'passo2' | 'timeout'>];
        logger.info(`Outcome detectado: "${outcome}" via seletor "${seletorDetectado}"`);
      } catch {
        logger.warn('Nenhum indicador de resultado detectado em 10s — capturando textos da página inteira como fallback');
      }

      // Captura os textos do container detectado (ou da página inteira como fallback)
      const textosCapturados = await scrapeVisibleTexts(page, seletorDetectado);

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
