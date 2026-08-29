import { expect, test, type Page } from '@playwright/test';

// /discs/add requires a signed-in admin, so these need a test account:
//   E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e
// Without one the suite skips rather than failing.
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel('Sähköpostiosoite').fill(EMAIL!);
  await page.getByLabel('Salasana').fill(PASSWORD!);
  await page.getByRole('button', { name: 'Kirjaudu sisään' }).click();
  await expect(page.getByRole('button', { name: 'Kirjaudu sisään' })).toHaveCount(0);
}

/**
 * Answers the save locally, so a test run never writes discs.
 *
 * This repo's .env points at the production Supabase project, so a real save
 * here would add real discs to the public list.
 */
async function stubSave(page: Page, response: { status?: number; json: unknown }): Promise<void> {
  await page.route('**/discs/create', (route) =>
    route.fulfill({ status: response.status ?? 200, json: response.json }),
  );
}

test.describe('/discs/add disc text parsing', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'Set E2E_EMAIL and E2E_PASSWORD to run these.');

    await signIn(page);
  });

  test('parses an entry and appends it to the table', async ({ page }) => {
    await page.goto('/discs/add');

    const input = page.getByLabel('Kiekon tiedot');

    await expect(page.getByText('Ei vielä tunnistettuja kiekkoja.')).toBeVisible();

    await input.fill('Star Destroyer punainen 050 123 4567 Steve D.');
    await input.press('Enter');

    const cells = page.locator('tbody tr').first().locator('td:nth-child(-n+6)');

    await expect(cells).toHaveText(['Destroyer', 'Star', 'Punainen', 'Innova', '0501234567', 'Steve D.']);

    // Nothing was left over, so the leftovers cell shows a dash.
    await expect(page.locator('tbody tr').first().locator('td').nth(6)).toHaveText('–');

    // The field clears so the next disc can be typed straight away.
    await expect(input).toHaveValue('');
  });

  test('flags a manufacturer it had to guess, and stops once corrected', async ({ page }) => {
    await page.goto('/discs/add');

    const input = page.getByLabel('Kiekon tiedot');

    // "Wave" is a disc name under two makers, so the one picked is a coin flip.
    await input.fill('Wave punainen');
    await input.press('Enter');

    const flag = page.locator('tbody tr').first().getByTitle('Valmistaja on epävarma – tarkista.');

    await expect(flag).toBeVisible();

    // A maker typed by hand is stated outright, so the flag goes.
    await page
      .locator('tbody tr')
      .first()
      .getByRole('button', { name: /^Valmistaja:/ })
      .click();
    await page.getByLabel('Valmistaja').fill('MVP');
    await page.getByLabel('Valmistaja').press('Enter');

    await expect(flag).toHaveCount(0);
  });

  test('leaves a confidently parsed manufacturer unflagged', async ({ page }) => {
    await page.goto('/discs/add');

    await page.getByLabel('Kiekon tiedot').fill('Mako3 keltainen');
    await page.getByLabel('Kiekon tiedot').press('Enter');

    await expect(page.getByTitle('Valmistaja on epävarma – tarkista.')).toHaveCount(0);
  });

  test('shows the words it could not place', async ({ page }) => {
    await page.goto('/discs/add');

    const input = page.getByLabel('Kiekon tiedot');

    // "punaienn" is a typo, so the colour is left empty -- the leftovers cell
    // is what says so, rather than the row looking like no colour was typed.
    await input.fill('Star Destroyer punaienn');
    await input.press('Enter');

    const row = page.locator('tbody tr').first();

    await expect(row.locator('td:nth-child(-n+6)').nth(2)).toHaveText('–');
    await expect(row.locator('td').nth(6)).toHaveText('punaienn');
  });

  test('leaves unidentified columns empty and keeps earlier rows', async ({ page }) => {
    await page.goto('/discs/add');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    await input.fill('S-Line DD3 pinkki Peter D.');
    await input.press('Enter');

    const rows = page.locator('tbody tr');

    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator('td:nth-child(-n+6)')).toHaveText(['Mako3', '–', 'Keltainen', 'Innova', '–', '–']);
    await expect(rows.nth(1).locator('td:nth-child(-n+6)')).toHaveText([
      'DD3',
      'S-Line',
      'Pinkki',
      'Discmania',
      '–',
      'Peter D.',
    ]);
  });

  test('edits a cell in place and keeps the change', async ({ page }) => {
    await page.goto('/discs/add');

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
    await expect(page.locator('tbody tr').first().locator('td:nth-child(-n+6)')).toHaveText([
      'Mako3',
      '–',
      'Punainen',
      'Innova',
      '–',
      '–',
    ]);
  });

  test('fills in a cell the parser left empty', async ({ page }) => {
    await page.goto('/discs/add');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    await page.getByRole('button', { name: 'Omistaja: tyhjä' }).click();

    const editor = page.getByRole('textbox', { name: 'Omistaja' });

    await editor.fill('Steve D.');
    await editor.press('Enter');

    await expect(page.locator('tbody tr').first().locator('td:nth-child(-n+6)').nth(5)).toHaveText('Steve D.');
  });

  test('discards an edit on Escape', async ({ page }) => {
    await page.goto('/discs/add');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    await page.getByRole('button', { name: 'Kiekko: Mako3' }).click();

    const editor = page.getByRole('textbox', { name: 'Kiekko' });

    await editor.fill('Roimaa');
    await editor.press('Escape');

    await expect(page.locator('tbody tr').first().locator('td:nth-child(-n+6)').nth(0)).toHaveText('Mako3');
  });

  test('clearing a cell leaves it empty', async ({ page }) => {
    await page.goto('/discs/add');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    await page.getByRole('button', { name: 'Väri: Keltainen' }).click();

    const editor = page.getByRole('textbox', { name: 'Väri' });

    await editor.fill('   ');
    await editor.press('Enter');

    await expect(page.locator('tbody tr').first().locator('td:nth-child(-n+6)').nth(2)).toHaveText('–');
  });

  test('edits only the row that was clicked', async ({ page }) => {
    await page.goto('/discs/add');

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

    await expect(page.locator('tbody tr').nth(0).locator('td:nth-child(-n+6)').nth(2)).toHaveText('Keltainen');
    await expect(page.locator('tbody tr').nth(1).locator('td:nth-child(-n+6)').nth(2)).toHaveText('Sininen');
  });

  test('removes a row only after the delete is confirmed', async ({ page }) => {
    await page.goto('/discs/add');

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
    await expect(rows.first().locator('td:nth-child(-n+6)').nth(0)).toHaveText('Destroyer');
  });

  test('shows the empty message again once the last row is deleted', async ({ page }) => {
    await page.goto('/discs/add');

    const input = page.getByLabel('Kiekon tiedot');

    await input.fill('Mako3 keltainen');
    await input.press('Enter');

    await page.getByRole('button', { name: 'Poista rivi 1' }).click();
    await page.getByRole('button', { name: 'Kyllä' }).click();

    await expect(page.getByText('Ei vielä tunnistettuja kiekkoja.')).toBeVisible();
  });

  test('saves the batch, showing progress then a success box', async ({ page }) => {
    await stubSave(page, { json: { savedCount: 2, externalIds: [] } });
    await page.goto('/discs/add');

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

    // The batch is persisted, so the entry table is cleared for the next one.
    await expect(page.locator('table').first().locator('tbody tr')).toHaveCount(1);
    await expect(page.getByText('Ei vielä tunnistettuja kiekkoja.')).toBeVisible();
    await expect(save).toBeDisabled();
  });

  test('shows an error box and keeps the rows when saving fails', async ({ page }) => {
    // The route's own failure, rather than the removed ?simulate=error stub.
    await stubSave(page, { status: 500, json: { error: 'Tallennus epäonnistui. Yritä uudelleen.' } });
    await page.goto('/discs/add');

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
    await stubSave(page, { json: { savedCount: 1, externalIds: [] } });
    await page.goto('/discs/add');

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
