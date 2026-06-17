import { test, expect } from '@playwright/test';

// DiscTable migrated from react-data-grid to a TanStack-Table-driven native
// <table>. Verify it renders, shows the expected columns, and sorts on header
// click.
test('DiscTable renders columns and rows, and sorts on header click', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  await page.goto('/');

  const table = page.getByRole('table');
  await expect(table).toBeVisible({ timeout: 20_000 });

  // Expected headers.
  for (const name of ['#', 'Kiekko', 'Väri', 'Omistaja', 'Puhelinnumero', 'Lisätty']) {
    await expect(page.getByRole('columnheader', { name, exact: true })).toBeVisible();
  }

  // Rows present.
  const rowCount = await page.getByRole('row').count();
  expect(rowCount).toBeGreaterThan(1); // header + at least one data row

  // Sort by "Kiekko" (disc name) and capture the first cell before/after toggling.
  const kiekko = page.getByRole('columnheader', { name: 'Kiekko', exact: true });
  const firstDiscCell = () => page.getByRole('row').nth(1).getByRole('cell').nth(1);
  await kiekko.click();
  const ascFirst = (await firstDiscCell().innerText()).trim();
  await kiekko.click(); // toggle to descending
  const descFirst = (await firstDiscCell().innerText()).trim();
  expect(ascFirst).not.toBe(descFirst); // order changed

  await page.screenshot({ path: 'e2e/__screens__/05-disc-table.png', clip: { x: 0, y: 0, width: 1000, height: 360 } });

  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
});
