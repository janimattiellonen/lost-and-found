import { test, expect } from '@playwright/test';

// Verifies the Downshift-based DiscSelector on the home page:
//  - clicking the field opens the full disc-name list (the regression we fixed)
//  - typing filters the list
// Data-agnostic: it reads the actual options rather than hard-coding disc names.
test('DiscSelector opens the full list on click and filters on type', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  await page.goto('/');

  // Disc names load client-side (fetcher.load('/foo')); wait for the disc grid
  // to render so the combobox has data before we open it.
  await expect(page.getByRole('grid')).toBeVisible({ timeout: 20_000 });

  const input = page.getByRole('combobox').first();
  await expect(input).toBeVisible();

  // Click → full list opens.
  await input.click();
  const options = page.getByRole('option');
  await expect(options.first()).toBeVisible();
  const fullCount = await options.count();
  expect(fullCount).toBeGreaterThan(0);
  await page.screenshot({ path: 'e2e/__screens__/01-open-on-click.png' });

  // Type a substring taken from a real option → list filters down.
  const firstText = (await options.first().innerText()).trim();
  const fragment = firstText.slice(0, 2).toLowerCase();
  await input.fill(fragment);
  await expect(options.first()).toBeVisible();
  const filteredCount = await options.count();
  expect(filteredCount).toBeLessThanOrEqual(fullCount);

  // Every remaining option should contain the typed fragment.
  const texts = await options.allInnerTexts();
  for (const t of texts) {
    expect(t.toLowerCase()).toContain(fragment);
  }
  await page.screenshot({ path: 'e2e/__screens__/02-filtered.png' });

  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
});
