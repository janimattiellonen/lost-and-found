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

  test('edits a cell in place and keeps the change', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    // Open the colour cell, type over the old value, commit with Enter.
    await page.getByRole('button', { name: 'Väri: Keltainen' }).click();

    const editor = page.getByRole('textbox', { name: 'Väri' });

    await expect(editor).toBeFocused();

    await editor.fill('Punainen');
    await editor.press('Enter');

    await expect(editor).toBeHidden();
    await expect(page.locator('tbody tr').first().locator('td')).toHaveText([
      'Mako3',
      '–',
      'Punainen',
      'Innova',
      '–',
      '–',
    ]);
  });

  test('fills in a cell the parser left empty', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    await page.getByRole('button', { name: 'Omistaja: tyhjä' }).click();

    const editor = page.getByRole('textbox', { name: 'Omistaja' });

    await editor.fill('Steve D.');
    await editor.press('Enter');

    await expect(page.locator('tbody tr').first().locator('td').nth(5)).toHaveText('Steve D.');
  });

  test('discards an edit on Escape', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    await page.getByRole('button', { name: 'Kiekko: Mako3' }).click();

    const editor = page.getByRole('textbox', { name: 'Kiekko' });

    await editor.fill('Roimaa');
    await editor.press('Escape');

    await expect(page.locator('tbody tr').first().locator('td').nth(0)).toHaveText('Mako3');
  });

  test('clearing a cell leaves it empty', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    await page.getByRole('button', { name: 'Väri: Keltainen' }).click();

    const editor = page.getByRole('textbox', { name: 'Väri' });

    await editor.fill('   ');
    await editor.press('Enter');

    await expect(page.locator('tbody tr').first().locator('td').nth(2)).toHaveText('–');
  });

  test('edits only the row that was clicked', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');
    await input.fill('Star Destroyer keltainen');
    await input.press('Enter');

    // Both rows are yellow; edit the second one only.
    await page.locator('tbody tr').nth(1).getByRole('button', { name: 'Väri: Keltainen' }).click();

    const editor = page.getByRole('textbox', { name: 'Väri' });

    await editor.fill('Sininen');
    await editor.press('Enter');

    await expect(page.locator('tbody tr').nth(0).locator('td').nth(2)).toHaveText('Keltainen');
    await expect(page.locator('tbody tr').nth(1).locator('td').nth(2)).toHaveText('Sininen');
  });
});
