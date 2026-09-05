import { expect, test } from '@playwright/test';

test('product detail exposes real technical information and no commerce controls', async ({
  page,
}) => {
  await page.goto('/products/ariana-recessed-round-downlight');
  await expect(page.getByRole('heading', { name: 'چراغ دانلايت توكار گرد آريانا' })).toBeVisible();
  await expect(page.getByText('31AX014001')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'مشخصات محصول' })).toBeVisible();
  await expect(page.getByText('توان')).toBeVisible();
  await expect(page.getByText(/سبد خرید|پرداخت آنلاین|افزودن به سبد/)).toHaveCount(0);
});

test('an unpublished or unknown product address shows a safe not-found state', async ({ page }) => {
  await page.goto('/products/does-not-exist');
  await expect(page.getByRole('heading', { name: 'محصول پیدا نشد' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'بازگشت به محصولات' })).toBeVisible();
});
