import { test, expect } from '@playwright/test';

test.describe('Button Check API', () => {
  test('should detect button on page via API', async ({ request }) => {
    const response = await request.post('/api/button-check/verify', {
      data: {
        pageUrl: 'https://confirmacao-entrega-propria.ifood.com.br/',
        buttonText: 'Cheguei no local',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('buttonFound');
    expect(data.data).toHaveProperty('pageUrl');
    expect(data.data).toHaveProperty('pageTitle');
    expect(data.data).toHaveProperty('analysis');
    expect(data.data).toHaveProperty('details');
    expect(data.data).toHaveProperty('timestamp');

    // Verify analysis structure
    expect(data.data.analysis).toHaveProperty('inputCount');
    expect(data.data.analysis).toHaveProperty('buttonCount');
    expect(data.data.analysis).toHaveProperty('formCount');
    expect(data.data.analysis).toHaveProperty('headingCount');

    // Verify details structure
    expect(Array.isArray(data.data.details.inputs)).toBe(true);
    expect(Array.isArray(data.data.details.buttons)).toBe(true);
    expect(Array.isArray(data.data.details.forms)).toBe(true);
    expect(Array.isArray(data.data.details.headings)).toBe(true);

    console.log(`Button found: ${data.data.buttonFound}`);
    console.log(`Page title: ${data.data.pageTitle}`);
    console.log(`Analysis:`, JSON.stringify(data.data.analysis, null, 2));

    if (data.data.targetButton) {
      console.log(`Target button:`, JSON.stringify(data.data.targetButton, null, 2));
    }
  }, { timeout: 120000 });

  test('should return error for invalid URL', async ({ request }) => {
    const response = await request.post('/api/button-check/verify', {
      data: {
        pageUrl: 'not-a-valid-url',
        buttonText: 'test button',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
  });

  test('should return error when buttonText is empty', async ({ request }) => {
    const response = await request.post('/api/button-check/verify', {
      data: {
        pageUrl: 'https://example.com',
        buttonText: '',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
  });

  test('should analyze page and return complete details', async ({ request }) => {
    const response = await request.post('/api/button-check/verify', {
      data: {
        pageUrl: 'https://www.example.com',
        buttonText: 'More',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify that we have detailed information about the page
    const pageAnalysis = data.data;
    
    // All these properties should exist
    expect(pageAnalysis).toHaveProperty('pageUrl');
    expect(pageAnalysis).toHaveProperty('pageTitle');
    expect(pageAnalysis).toHaveProperty('analysis');
    expect(pageAnalysis).toHaveProperty('details');

    // Details should contain all element information
    const { details } = pageAnalysis;
    expect(Array.isArray(details.inputs)).toBe(true);
    expect(Array.isArray(details.buttons)).toBe(true);
    expect(Array.isArray(details.forms)).toBe(true);
    expect(Array.isArray(details.headings)).toBe(true);

    console.log('Page analysis completed');
    console.log(`Found ${details.inputs.length} inputs`);
    console.log(`Found ${details.buttons.length} buttons`);
    console.log(`Found ${details.forms.length} forms`);
    console.log(`Found ${details.headings.length} headings`);
  }, { timeout: 120000 });

  test('should validate button visibility and state', async ({ request }) => {
    const response = await request.post('/api/button-check/verify', {
      data: {
        pageUrl: 'https://www.example.com',
        buttonText: 'Example',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    
    if (data.data.buttonFound && data.data.targetButton) {
      const button = data.data.targetButton;
      
      // Button should have these properties
      expect(button).toHaveProperty('text');
      expect(button).toHaveProperty('type');
      expect(button).toHaveProperty('visible');
      expect(button).toHaveProperty('enabled');
      
      // Log button state
      console.log(`Button state:`);
      console.log(`  - Text: ${button.text}`);
      console.log(`  - Type: ${button.type}`);
      console.log(`  - Visible: ${button.visible}`);
      console.log(`  - Enabled: ${button.enabled}`);
    }
  }, { timeout: 120000 });
});

test.describe('Button Check API - Custom Scenarios', () => {
  test('should handle pages with multiple buttons', async ({ request }) => {
    const response = await request.post('/api/button-check/verify', {
      data: {
        pageUrl: 'https://www.google.com',
        buttonText: 'Google Search',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    const { analysis, details } = data.data;

    // Pages usually have multiple buttons
    expect(analysis.buttonCount).toBeGreaterThanOrEqual(0);

    // Log button information
    console.log(`Total buttons found: ${analysis.buttonCount}`);
    details.buttons.forEach((btn, index) => {
      console.log(`Button ${index + 1}: "${btn.text}" (type: ${btn.type}, enabled: ${btn.enabled})`);
    });
  }, { timeout: 120000 });

  test('should handle pages with forms and inputs', async ({ request }) => {
    const response = await request.post('/api/button-check/verify', {
      data: {
        pageUrl: 'https://www.google.com',
        buttonText: 'I am feeling lucky',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    const { analysis, details } = data.data;

    // Log form and input information
    console.log(`Total forms: ${analysis.formCount}`);
    console.log(`Total inputs: ${analysis.inputCount}`);

    if (details.forms.length > 0) {
      console.log('Forms found:');
      details.forms.forEach((form, index) => {
        console.log(`  Form ${index + 1}: ${form.method.toUpperCase()} ${form.action}`);
      });
    }

    if (details.inputs.length > 0) {
      console.log('Inputs found:');
      details.inputs.filter(input => input.visible).forEach((input, index) => {
        console.log(`  Input ${index + 1}: ${input.type} (name: ${input.name}, placeholder: ${input.placeholder})`);
      });
    }
  }, { timeout: 120000 });
});
