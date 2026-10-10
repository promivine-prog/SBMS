import { expect, type Page, test } from '@playwright/test';

// Click-through review: student journey across the whole app.
// Screenshots land in e2e/shots (git-ignored).
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

/** Click a nav link and wait for the destination page (kills nav-then-fill races). */
async function go(page: Page, link: string, heading: string): Promise<void> {
  await page.getByRole('link', { name: link, exact: true }).click();
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
}

test('full student journey', async ({ page }) => {
  // 1. Welcome → setup
  await expect(page.getByRole('heading', { name: 'SBMS' })).toBeVisible();
  await page.getByRole('button', { name: 'Plan my money' }).click();
  const setup = page.locator('main');
  await setup.getByLabel(/Available money/).fill('12500');
  await setup.getByLabel(/Protected for essentials/).fill('6000');
  await setup.getByLabel(/Days to plan/).fill('9');
  await setup.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My Money Plan' })).toBeVisible();
  await expect(page.getByText('₦722.22')).toBeVisible(); // (12500-6000)/9
  await page.screenshot({ path: 'e2e/shots/01-home-runway.png' });

  // 2. Budgets
  await go(page, 'Budget', 'Budgets');
  await page.getByLabel(/Category/).fill('food');
  await page.getByLabel(/Limit/).fill('6000');
  await page.getByRole('button', { name: 'Add budget' }).click();
  await page.getByLabel(/Category/).fill('transport');
  await page.getByLabel(/Limit/).fill('3000');
  await page.getByRole('button', { name: 'Add budget' }).click();
  await expect(page.getByText('Remaining: ₦6,000', { exact: false })).toBeVisible();

  // 3. Goal
  await go(page, 'Goals', 'Savings goals');
  await page.getByLabel(/Goal name/).fill('Textbooks');
  await page.getByLabel(/^Target/).fill('5000');
  await page.getByRole('button', { name: 'New goal' }).click();
  await expect(page.getByText('Textbooks')).toBeVisible();

  // 4. Cash income + allocate-on-entry (5000 food, 3000 goal)
  await go(page, 'Add', 'Add transaction');
  await page.getByLabel(/^Amount/).fill('8000');
  await page.locator('section > div').first().getByLabel(/^Type/).selectOption('income');
  await page.getByRole('button', { name: 'Add split' }).click();
  await page.getByRole('button', { name: 'Add split' }).click();
  const rows = page.locator('fieldset div');
  await rows.nth(0).locator('select').selectOption({ index: 0 });
  await rows.nth(0).locator('input').fill('5000');
  await rows.nth(1).locator('select').selectOption({ index: 2 });
  await rows.nth(1).locator('input').fill('3000');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await go(page, 'Goals', 'Savings goals');
  await expect(page.getByText('₦3,000 / ₦5,000')).toBeVisible();
  await page.screenshot({ path: 'e2e/shots/02-goal-allocated.png' });

  // 5. Cash expense → cash on hand drops
  await go(page, 'Home', 'My Money Plan');
  await expect(page.getByText('Cash on hand: ₦8,000')).toBeVisible();
  await go(page, 'Add', 'Add transaction');
  await page.getByLabel(/^Amount/).fill('1500');
  await page.getByLabel(/^Category/).fill('food');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await go(page, 'Home', 'My Money Plan');
  await expect(page.getByText('Cash on hand: ₦6,500')).toBeVisible();

  // 6. Reconcile: count 6000 → accept −500 Unaccounted
  await page.getByRole('button', { name: 'Count my cash' }).click();
  await page.getByLabel(/physically in hand/).fill('6000');
  await expect(page.getByText('Difference: ₦-500')).toBeVisible();
  await page.getByRole('button', { name: 'Accept adjustment' }).click();
  await expect(page.getByText('Cash on hand: ₦6,000')).toBeVisible();
  await expect(page.getByText('unexplained cash gap recorded this week')).toBeVisible();
  await page.screenshot({ path: 'e2e/shots/03-reconciled.png' });

  // 7. Irregular income: past-dated expectation → stale banner → delay
  await go(page, 'Income', 'Expected income');
  await page.getByLabel(/^Source/).fill('Allowance');
  await page.getByLabel(/Expected date/).fill('2020-01-01');
  await page.getByRole('button', { name: 'Add expected income' }).click();
  await expect(page.getByText('This date has passed')).toBeVisible();
  await page.getByRole('button', { name: 'Delayed' }).click();
  await expect(page.getByText('This date has passed')).toBeHidden();

  // 8. Overspend → Survival Mode with supportive copy
  await go(page, 'Add', 'Add transaction');
  await page.getByLabel(/^Amount/).fill('4000');
  await page.getByLabel(/^Category/).fill('transport');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await go(page, 'Home', 'My Money Plan');
  await expect(page.getByRole('heading', { name: 'Survival Mode' })).toBeVisible();
  await expect(page.getByText('may run short')).toBeVisible();
  await expect(page.getByText('You failed')).toBeHidden();
  await page.screenshot({ path: 'e2e/shots/04-survival.png' });

  // 9. Language switch preserves session
  await go(page, 'Settings', 'Settings');
  await page.getByLabel(/Language/).selectOption('yo');
  await expect(page.getByRole('link', { name: 'Ilé' })).toBeVisible();
  await page.getByRole('link', { name: 'Ètò' }).click();
  await page.getByLabel(/Language/).selectOption('en');
  await go(page, 'Home', 'My Money Plan');
  await expect(page.getByText('Cash on hand: ₦2,000')).toBeVisible();

  // 10. Lesson quiz + progress
  await go(page, 'Learn', 'Learn');
  await page.getByRole('button', { name: /Budgeting basics/ }).click();
  await expect(page.getByText('A budget is a plan')).toBeVisible();
  for (const n of [0, 1, 2]) {
    await page.locator('fieldset').nth(n).locator('label').first().click();
  }
  await page.getByRole('button', { name: 'Submit answers' }).click();
  await expect(page.getByText('Your best: 3/3')).toBeVisible();

  // 11. Simulator: borrow path shows outcome + risk + hypothetical
  await go(page, 'Simulator', 'Simulator');
  await page.getByRole('button', { name: /Allowance delayed/ }).click();
  await expect(page.getByText('HYPOTHETICAL')).toBeVisible();
  await page.getByRole('button', { name: /Borrow ₦3,000/ }).click();
  await expect(page.getByText('Risk to understand')).toBeVisible();
  await page.screenshot({ path: 'e2e/shots/05-simulator.png' });

  // 12. History filters hide non-matching records
  await go(page, 'Add', 'Add transaction');
  await page.locator('section > div').nth(1).getByLabel(/^Type/).selectOption('income');
  await expect(page.getByText('Unaccounted', { exact: false }).first()).toBeHidden();
  await page.locator('section > div').nth(1).getByLabel(/^Type/).selectOption('all');

  // 13. Demo reset returns to Welcome
  await go(page, 'Settings', 'Settings');
  await expect(page.getByText('Demo data (fictional)')).toBeHidden();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('heading', { name: 'SBMS' })).toBeVisible();

  // 14. Cloud is configured on this build (env wired)
  await page.getByRole('button', { name: 'Explore demo' }).click();
  await page.goto('/');
  await go(page, 'Account', 'Account & cloud backup');
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
});
