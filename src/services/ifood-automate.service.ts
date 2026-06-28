import { Page } from 'playwright';
import logger from '../config/logger';
import { browserService } from './browser.service';
import { ConfirmationResult } from '../types/confirmAutomate.types';

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
      const pageUrl = 'https://confirmacao-entrega-propria.ifood.com.br/numero-pedido';

      // domcontentloaded é mais confiável que networkidle em SPAs com polling/websockets
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

      // Aguarda o primeiro input aparecer (mais robusto que confiar apenas no goto)
      await page.waitForSelector('input[type="tel"]', { timeout: 15000 });

      const inputs = page.locator('input[type="tel"]');
      const inputCount = await inputs.count();

      logger.info(`Inputs encontrados na tela inicial: ${inputCount}`);

      if (inputCount === 8) {
        const digitos = localizer.split('');

        for (let i = 0; i < inputCount; i++) {
          await inputs.nth(i).fill(digitos[i]);
        }

        logger.info(`Localizador preenchido "${localizer}" na página`);

      } else {
        // Captura HTML para diagnóstico em produção headless
        const htmlSnippet = (await page.content()).substring(0, 800);
        logger.error(`Número de inputs inesperado: ${inputCount}. Esperado: 8. HTML: ${htmlSnippet}`);
        return {
          success: false,
          error: `Número de inputs inesperado: ${inputCount}. Esperado: 8.`,
        };
      }

      const botaoContinuar = page.locator('button, [type="submit"]').filter({ hasText: /continuar/i });
      if (await botaoContinuar.count() > 0) {
        await botaoContinuar.first().click();
        logger.info(`Botão "Continuar" clicado na página`);
      } else {
        logger.error('Botão "Continuar" não encontrado na tela inicial');
        return {
          success: false,
          error: 'Botão "Continuar" não encontrado na tela inicial',
        };
      }

      // Aguarda a tela mudar: os 8 inputs da primeira tela devem desaparecer
      await page.waitForFunction(
        () => document.querySelectorAll('input[type="tel"]').length !== 8,
        { timeout: 15000 },
      ).catch(() => {
        // Se não mudar em 15s, continua e deixa a validação abaixo reportar o erro
      });

      const inputsAtuais = page.locator('input[type="tel"]');
      const countAtual = await inputsAtuais.count();

      logger.info(`Inputs encontrados na tela de código: ${countAtual}`);

      if (countAtual === 4) {
        logger.info(`📝 Inserindo código de segurança: ${code}\n`);
        const codeDigits = code.split('');

        for (let i = 0; i < 4; i++) {
          await inputsAtuais.nth(i).fill(codeDigits[i]);
        }

        const botaoFinal = page.locator('button, [type="submit"]').filter({ hasText: /continuar/i });
        if (await botaoFinal.count() > 0) {
          await botaoFinal.first().click();
          logger.info(`Botão "Continuar" clicado após inserir o código de segurança`);

          // Aguarda o modal de resultado aparecer (classe estável no HTML do ActionSheet)
          await page.waitForSelector('[class*="ActionSheet__container"]', { timeout: 15000 })
            .catch(() => {
              logger.warn('Modal de resultado não detectado em 15s — capturando textos da página assim mesmo');
            });

          logger.info('Modal de resultado detectado — capturando textos');
        } else {
          logger.error(`Botão "Continuar" não encontrado após inserir o código de segurança`);
          return {
            success: false,
            error: `Botão "Continuar" não encontrado após inserir o código de segurança`,
          };
        }

      } else {
        // Captura HTML para diagnóstico em produção headless
        const htmlSnippet = (await page.content()).substring(0, 800);
        logger.error(`❌ Condição não atendida: ${countAtual} campos encontrados. Esperado: 4. HTML: ${htmlSnippet}`);
        return {
          success: false,
          error: `❌ Condição não atendida: ${countAtual} campos encontrados. Esperado: 4.`,
        };
      }

      // Captura os textos visíveis dentro do modal de resultado
      const textosCapturados = await page.evaluate(() => {
        // Foca no modal — evita capturar textos do formulário ao fundo
        const modal = document.querySelector('[class*="ActionSheet__container"]');
        const raiz = modal ?? document; // fallback para página inteira se o modal não existir

        const elementos = Array.from(raiz.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,strong,b,em,i')).filter(el => {
          const texto = el.textContent?.trim();
          const htmlEl = el as HTMLElement;
          const style = window.getComputedStyle(el);

          return texto &&
                 texto.length > 2 &&
                 texto.length < 500 &&
                 style.display !== 'none' &&
                 htmlEl.offsetHeight > 0 &&
                 !texto.includes('undefined');
        }).map(el => {
          const htmlEl = el as HTMLElement;
          return {
            tag: el.tagName.toLowerCase(),
            texto: el.textContent?.trim() ?? '',
            classes: htmlEl.className,
            isHeading: el.tagName.match(/^H[1-6]$/) !== null,
          };
        });

        // Remove duplicatas e prioriza headings
        return elementos
          .filter((item, index, arr) => arr.findIndex(i => i.texto === item.texto) === index)
          .sort((a, b) => {
            if (a.isHeading && !b.isHeading) return -1;
            if (!a.isHeading && b.isHeading) return 1;
            return (a.texto?.length || 0) - (b.texto?.length || 0);
          });
      });

      logger.info(`Textos capturados na tela final: ${textosCapturados.length}`);

      return {
        success: true,
        textosCapturados,
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error analyzing page: ${message}`);

      // Screenshot para diagnóstico visual em falhas no ambiente headless
      if (page) {
        await page.screenshot({ path: `/tmp/ifood-error-${Date.now()}.png`, fullPage: true }).catch(() => {});
        logger.info('Screenshot de diagnóstico salvo em /tmp/');
      }

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
