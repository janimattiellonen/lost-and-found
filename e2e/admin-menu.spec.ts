import { expect, test, type Page } from '@playwright/test';

// The admin menu only exists for a signed-in admin, so these need a test
// account:
//   E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e
// Without one the suite skips rather than failing.
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

// Narrow enough to be below the 768px breakpoint in AdminMenu.
const PHONE = { width: 390, height: 844 };

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel('Sähköpostiosoite').fill(EMAIL!);
  await page.getByLabel('Salasana').fill(PASSWORD!);
  await page.getByRole('button', { name: 'Kirjaudu sisään' }).click();
  await expect(page.getByRole('button', { name: 'Kirjaudu sisään' })).toHaveCount(0);
}

test.describe('admin menu on a phone-sized screen', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'Set E2E_EMAIL and E2E_PASSWORD to run these.');

    await page.setViewportSize(PHONE);
    await signIn(page);
    await page.goto('/');
  });

  test('hides the links until the hamburger is pressed, then closes on a link', async ({ page }) => {
    const panel = page.getByRole('dialog', { name: 'Valikko' });

    // Not merely off-screen: the links are not in the page at all.
    await expect(page.getByRole('link', { name: 'Tyhjennysloki' })).toHaveCount(0);
    await expect(panel).toHaveCount(0);

    await page.getByRole('button', { name: /^Avaa valikko/ }).click();

    await expect(panel).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Tyhjennysloki' })).toBeVisible();

    await panel.getByRole('link', { name: 'Tyhjennysloki' }).click();

    await expect(page).toHaveURL(/\/emptying-log$/);
    await expect(panel).toHaveCount(0);
  });

  test('traps focus, closes on Escape and gives focus back to the hamburger', async ({ page }) => {
    const hamburger = page.getByRole('button', { name: /^Avaa valikko/ });

    await hamburger.click();

    // Focus lands on the close button, and Shift+Tab wraps to the last thing in
    // the panel rather than escaping into the page behind it.
    await expect(page.getByRole('button', { name: 'Sulje valikko' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Kirjaudu ulos' })).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Valikko' })).toHaveCount(0);
    await expect(hamburger).toBeFocused();
  });

  test('gives focus back to the hamburger when closed by tapping outside', async ({ page }) => {
    const hamburger = page.getByRole('button', { name: /^Avaa valikko/ });

    await hamburger.click();
    await expect(page.getByRole('dialog', { name: 'Valikko' })).toBeVisible();

    // The dimmed area covers the whole viewport, so the top-left corner is
    // outside the panel, which sits on the right.
    await page.mouse.click(10, 300);

    await expect(page.getByRole('dialog', { name: 'Valikko' })).toHaveCount(0);
    await expect(hamburger).toBeFocused();
  });

  test('makes the page behind the panel inert', async ({ page }) => {
    const inertCount = () => page.locator('body > [inert]').count();

    expect(await inertCount()).toBe(0);

    await page.getByRole('button', { name: /^Avaa valikko/ }).click();

    // The bar and the page content are both direct children of <body>; neither
    // the panel nor its backdrop may be inert.
    expect(await inertCount()).toBeGreaterThan(0);
    await expect(page.getByRole('dialog', { name: 'Valikko' })).not.toHaveAttribute('inert', '');

    await page.keyboard.press('Escape');

    expect(await inertCount()).toBe(0);
  });

  test('blocks scrolling of the page behind the panel', async ({ page }) => {
    const overflow = () => page.evaluate(() => document.body.style.overflow);

    await expect.poll(overflow).toBe('');

    await page.getByRole('button', { name: /^Avaa valikko/ }).click();
    await expect.poll(overflow).toBe('hidden');

    await page.getByRole('button', { name: 'Sulje valikko' }).click();
    await expect.poll(overflow).toBe('');
  });
});
