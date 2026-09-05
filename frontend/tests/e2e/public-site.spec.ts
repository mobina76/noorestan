import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage presents the real business identity without commerce controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { name: /روشنایی حرفه‌ای/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /مشاهده محصولات/ })).toBeVisible();
  await expect(page.getByText('محصولات شاخص')).toBeVisible();
  await expect(page.getByText('چرا نورستان؟')).toBeVisible();
  await expect(page.getByText(/برای پروژه بعدی/)).toBeVisible();
  await expect(page.getByText(/سبد خرید|پرداخت آنلاین|تسویه حساب/)).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('mobile navigation and reduced motion remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'نمایش فهرست' });
  await menu.click();
  await expect(
    page.getByLabel('ناوبری اصلی').getByRole('link', { name: 'محصولات', exact: true }),
  ).toBeVisible();
});

test('company and contact pages reflect the real business profile', async ({ page }) => {
  await page.goto('/company');
  await expect(page.getByRole('heading', { name: 'فروشگاه کالای برق نورستان' })).toBeVisible();
  await page.goto('/contact');
  await expect(page.getByText('تهران، خیابان لاله‌زار نو').first()).toBeVisible();
});
