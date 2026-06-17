import { test, expect } from '@playwright/test';

// NumberSearch is the phone-number search box on the home page (migrated off
// MUI TextField to the StyleX TextField). Verify it renders with its accessible
// name and accepts input.
test('NumberSearch renders and accepts input', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  await page.goto('/');

  const search = page.getByRole('textbox', { name: 'Puh nro., 4 viimeistä' });
  await expect(search).toBeVisible();

  await search.fill('3904');
  await expect(search).toHaveValue('3904');

  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
});
