import { expect, test } from '@playwright/test';

test('product detail exposes technical information and direct contact only', async ({ page }) => {
  await page.goto('/products/luna-linear');
  await expect(page.getByRole('heading', { name: 'چراغ خطی لونا' })).toBeVisible();
  await expect(page.getByText('MZ-LN-120')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'مشخصات محصول' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'گفت‌وگو در واتساپ' })).toHaveAttribute('href', /text=.*MZ-LN-120/);
  await expect(page.getByText(/سبد خرید|پرداخت آنلاین|افزودن به سبد/)).toHaveCount(0);
});
