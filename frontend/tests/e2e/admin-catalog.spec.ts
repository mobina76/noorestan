import { expect, test } from '@playwright/test';

// Uses the local development owner account created via `dotnet run -- bootstrap-owner`
// with the credentials documented in appsettings.Development.json for this environment.
const OWNER_EMAIL = 'owner@noorestan.local';
const OWNER_PASSWORD = 'Owner!Change12345';

test('unauthenticated visitors are redirected away from the admin area', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('an administrator can sign in and manage the real catalog', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('پست الکترونیک').fill(OWNER_EMAIL);
  await page.getByLabel('رمز عبور').fill(OWNER_PASSWORD);
  await page.getByRole('button', { name: 'ورود به مدیریت' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'داشبورد' })).toBeVisible();

  const menuToggle = page.getByRole('button', { name: 'نمایش فهرست مدیریت' });
  if (await menuToggle.isVisible()) await menuToggle.click();
  await page.getByRole('link', { name: 'محصولات' }).click();
  await expect(page.getByRole('heading', { name: 'محصولات' })).toBeVisible();
  await expect(page.getByText('چراغ دانلايت توكار گرد آريانا')).toBeVisible();

  await expect(page.getByRole('button', { name: 'خروج' })).toBeVisible();
});
