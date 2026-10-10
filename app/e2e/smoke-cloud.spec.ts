import { expect, test } from '@playwright/test';

// Live staging smoke test. OFF by default; runs only with SMOKE_CLOUD=1.
// Creates one obvious test user and uploads/downloads demo-seeded records.
// The test user remains in the dashboard until deleted there (cascades data).
test.skip(!process.env.SMOKE_CLOUD, 'set SMOKE_CLOUD=1 to hit staging');

test('staging auth + upload + download round-trip', async ({ page }) => {
  await page.goto('/account');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // Welcome gate → explore demo for rich seed data
  await page.getByRole('button', { name: 'Explore demo' }).click();
  await page.goto('/'); // Welcome swaps to Router at the current URL; land on Home
  await expect(page.getByRole('heading', { name: 'My Money Plan' })).toBeVisible();

  await page.getByRole('link', { name: 'Account' }).click();
  const email = process.env.SMOKE_EMAIL ?? `sbms.smoke.${Date.now()}@gmail.com`;
  const pwd = process.env.SMOKE_PASSWORD ?? 'Smoke-Test-12345!';
  await page.getByLabel(/Email/).fill(email);
  await page.getByLabel(/Password/).fill(pwd);
  await page.getByRole('button', { name: 'Create account' }).click();
  // If the address already exists (e.g. dashboard-created), fall back to login.
  if (!(await page.getByText('Logged in as').isVisible({ timeout: 8000 }))) {
    await page.getByRole('button', { name: 'Log in' }).click();
  }
  // If email confirmation is ON and the user is unconfirmed, this is where it stops.
  await expect(page.getByText('Logged in as')).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: 'Upload my records' }).click();
  await expect(page.getByText(/Uploaded records: \d+/)).toBeVisible({ timeout: 20000 });

  await page.getByRole('button', { name: 'Download cloud copy' }).click();
  await expect(page.getByText('Cloud copy applied')).toBeVisible({ timeout: 20000 });
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page.getByText('Cash on hand: ₦5,700')).toBeVisible();

  await page.getByRole('link', { name: 'Account' }).click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
});
