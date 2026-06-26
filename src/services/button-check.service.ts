import { Page } from 'playwright';
import logger from '../config/logger';
import { browserService } from './browser.service';
import { ButtonCheckResult, PageAnalysis } from '../types/scrape.types';

export class ButtonCheckService {
  async verifyButtonOnPage(
    pageUrl: string,
    buttonText: string,
  ): Promise<ButtonCheckResult> {
    let page: Page | null = null;

    try {
      await browserService.initialize();
      page = await browserService.createPage();

      logger.info(`Analyzing page: ${pageUrl} for button: "${buttonText}"`);
      await page.goto(pageUrl, { waitUntil: 'networkidle' });

      // Analyze page structure
      const analysis = await page.evaluate((searchText: string) => {
        // Find button by text
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]'));
        
        const targetButton = buttons.find(btn => {
          const text = btn.textContent?.trim().toLowerCase() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          return text.includes(searchText.toLowerCase()) || ariaLabel.includes(searchText.toLowerCase());
        });

        // Collect all inputs
        const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          value: input.value,
          required: input.required,
          visible: window.getComputedStyle(input).display !== 'none' && window.getComputedStyle(input).visibility !== 'hidden',
        }));

        // Collect all buttons
        const allButtons = buttons.map(btn => ({
          text: btn.textContent?.trim() || '',
          type: btn.getAttribute('type') || 'button',
          id: btn.getAttribute('id') || '',
          name: btn.getAttribute('name') || '',
          visible: window.getComputedStyle(btn).display !== 'none' && window.getComputedStyle(btn).visibility !== 'hidden',
          enabled: !btn.hasAttribute('disabled'),
        }));

        // Collect forms
        const forms = Array.from(document.querySelectorAll('form')).map(form => ({
          id: form.id,
          action: form.action,
          method: form.method,
          inputCount: form.querySelectorAll('input').length,
        }));

        // Collect headings
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(heading => ({
          tag: heading.tagName,
          text: heading.textContent?.trim() || '',
        }));

        return {
          buttonFound: !!targetButton,
          buttonDetails: targetButton ? {
            text: targetButton.textContent?.trim() || '',
            type: targetButton.getAttribute('type') || 'button',
            id: targetButton.getAttribute('id') || '',
            visible: window.getComputedStyle(targetButton).display !== 'none',
            enabled: !targetButton.hasAttribute('disabled'),
          } : null,
          inputs,
          buttons: allButtons,
          forms,
          headings,
          pageTitle: document.title,
          pageUrl: window.location.href,
        };
      }, buttonText);

      logger.info(`Button "${buttonText}" ${analysis.buttonFound ? 'found' : 'not found'} on page`);

      return {
        success: analysis.buttonFound,
        buttonFound: analysis.buttonFound,
        pageUrl: analysis.pageUrl,
        pageTitle: analysis.pageTitle,
        targetButton: analysis.buttonDetails,
        analysis: {
          inputCount: analysis.inputs.length,
          buttonCount: analysis.buttons.length,
          formCount: analysis.forms.length,
          headingCount: analysis.headings.length,
        },
        details: {
          inputs: analysis.inputs,
          buttons: analysis.buttons,
          forms: analysis.forms,
          headings: analysis.headings,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error analyzing page: ${message}`);
      
      return {
        success: false,
        buttonFound: false,
        pageUrl,
        error: message,
        timestamp: new Date().toISOString(),
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}

export const buttonCheckService = new ButtonCheckService();
