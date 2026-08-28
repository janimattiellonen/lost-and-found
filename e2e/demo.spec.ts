import { expect, test } from '@playwright/test';

test.describe('/demo disc text parsing', () => {
  test('parses an entry and appends it to the table', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');

    await expect(page.getByText('Ei vielä tunnistettuja kiekkoja.')).toBeVisible();

    await input.fill('Star Destroyer punainen 050 123 4567 Steve D.');
    await input.press('Enter');

    const cells = page.locator('tbody tr').first().locator('td');

    await expect(cells).toHaveText(['Destroyer', 'Star', 'Punainen', 'Innova', '0501234567', 'Steve D.']);

    // The field clears so the next disc can be typed straight away.
    await expect(input).toHaveValue('');
  });

  test('leaves unidentified columns empty and keeps earlier rows', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    await input.fill('S-Line DD3 pinkki Peter D.');
    await input.press('Enter');

    const rows = page.locator('tbody tr');

    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator('td')).toHaveText(['Mako3', '–', 'Keltainen', 'Innova', '–', '–']);
    await expect(rows.nth(1).locator('td')).toHaveText(['DD3', 'S-Line', 'Pinkki', 'Discmania', '–', 'Peter D.']);
  });
});
