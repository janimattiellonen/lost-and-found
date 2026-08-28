import { expect, test } from '@playwright/test';

test.describe('/demo disc text parsing', () => {
  test('parses an entry and appends it to the table', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');

    await expect(page.getByText('Ei vielä tunnistettuja kiekkoja.')).toBeVisible();

    await input.fill('Star Destroyer punainen 050 123 4567 Steve D.');
    await input.press('Enter');

    const cells = page.locator('tbody tr').first().locator('td:not(:last-child)');

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
    await expect(rows.nth(0).locator('td:not(:last-child)')).toHaveText([
      'Mako3',
      '–',
      'Keltainen',
      'Innova',
      '–',
      '–',
    ]);
    await expect(rows.nth(1).locator('td:not(:last-child)')).toHaveText([
      'DD3',
      'S-Line',
      'Pinkki',
      'Discmania',
      '–',
      'Peter D.',
    ]);
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
    await expect(page.locator('tbody tr').first().locator('td:not(:last-child)')).toHaveText([
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

    await expect(page.locator('tbody tr').first().locator('td:not(:last-child)').nth(5)).toHaveText('Steve D.');
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

    await expect(page.locator('tbody tr').first().locator('td:not(:last-child)').nth(0)).toHaveText('Mako3');
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

    await expect(page.locator('tbody tr').first().locator('td:not(:last-child)').nth(2)).toHaveText('–');
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

    await expect(page.locator('tbody tr').nth(0).locator('td:not(:last-child)').nth(2)).toHaveText('Keltainen');
    await expect(page.locator('tbody tr').nth(1).locator('td:not(:last-child)').nth(2)).toHaveText('Sininen');
  });

  test('removes a row only after the delete is confirmed', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');
    await input.fill('Star Destroyer punainen');
    await input.press('Enter');

    const rows = page.locator('tbody tr');

    await expect(rows).toHaveCount(2);

    // Pressing delete asks first and removes nothing on its own.
    await page.getByRole('button', { name: 'Poista rivi 1' }).click();
    await expect(page.getByText('Poistetaanko?')).toBeVisible();
    await expect(rows).toHaveCount(2);

    await page.getByRole('button', { name: 'Peruuta' }).click();
    await expect(rows).toHaveCount(2);
    await expect(page.getByText('Poistetaanko?')).toBeHidden();

    // Confirming removes that row and leaves the other one alone.
    await page.getByRole('button', { name: 'Poista rivi 1' }).click();
    await page.getByRole('button', { name: 'Kyllä' }).click();

    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('td:not(:last-child)').nth(0)).toHaveText('Destroyer');
  });

  test('shows the empty message again once the last row is deleted', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    await page.getByRole('button', { name: 'Poista rivi 1' }).click();
    await page.getByRole('button', { name: 'Kyllä' }).click();

    await expect(page.getByText('Ei vielä tunnistettuja kiekkoja.')).toBeVisible();
  });

  test('saves the batch, showing progress then a success box', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');
    const save = page.getByRole('button', { name: /Tallenna kiekot|Lähettää/ });

    // Nothing to save yet.
    await expect(save).toBeDisabled();

    await input.fill('Mako3 keltainen');
    await input.press('Enter');
    await input.fill('Star Destroyer punainen');
    await input.press('Enter');

    await expect(save).toBeEnabled();
    await expect(page.getByText('2 kiekkoa tallennettavana.')).toBeVisible();

    await save.click();

    // Mid-flight: the label changes and the button cannot be pressed again.
    await expect(save).toHaveText('Lähettää...');
    await expect(save).toBeDisabled();

    await expect(page.getByRole('status')).toContainText('2 kiekkoa lisättiin');

    // The batch is persisted, so the table is cleared for the next one.
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByText('Ei vielä tunnistettuja kiekkoja.')).toBeVisible();
    await expect(save).toBeDisabled();
  });

  test('shows an error box and keeps the rows when saving fails', async ({ page }) => {
    await page.goto('/demo?simulate=error');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    await page.getByRole('button', { name: 'Tallenna kiekot' }).click();

    await expect(page.getByRole('status')).toContainText('Tallennus epäonnistui');

    // Nothing was saved, so the work must still be there to retry.
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Tallenna kiekot' })).toBeEnabled();
  });

  test('clears a stale success box once the table changes again', async ({ page }) => {
    await page.goto('/demo');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');
    await page.getByRole('button', { name: 'Tallenna kiekot' }).click();

    await expect(page.getByRole('status')).toContainText('lisättiin');

    await input.fill('Star Destroyer punainen');
    await input.press('Enter');

    await expect(page.getByRole('status')).toBeEmpty();
  });
});
