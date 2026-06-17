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

test('filter row controls are bottom-aligned', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('grid')).toBeVisible({ timeout: 20_000 });

  const combo = page.getByRole('combobox').first(); // DiscSelector input (has a label above)
  const search = page.getByRole('textbox', { name: 'Puh nro., 4 viimeistä' });
  const button = page.getByRole('button', { name: 'Ohjeet' });

  const [c, s, b] = await Promise.all([combo.boundingBox(), search.boundingBox(), button.boundingBox()]);
  if (!c || !s || !b) throw new Error('missing bounding boxes');

  const bottom = (box: { y: number; height: number }) => box.y + box.height;
  // All three should share roughly the same bottom edge (within a few px).
  expect(Math.abs(bottom(c) - bottom(s))).toBeLessThanOrEqual(4);
  expect(Math.abs(bottom(c) - bottom(b))).toBeLessThanOrEqual(4);

  await page.screenshot({ path: 'e2e/__screens__/04-filter-row.png', clip: { x: 0, y: c.y - 60, width: 760, height: 140 } });
});
