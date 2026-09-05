import { expect, test } from '@playwright/test';

test('catalog supports search, category filtering, and recovery', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByText('چراغ خطی لونا')).toBeVisible();
  await page.getByLabel('جست‌وجوی محصول').fill('نوا');
  await expect(page.getByText('دان‌لایت نوا')).toBeVisible();
  await expect(page.getByText('چراغ خطی لونا')).toHaveCount(0);
  await page.getByLabel('جست‌وجوی محصول').fill('وجود ندارد');
  await expect(page.getByRole('heading', { name: 'نتیجه‌ای پیدا نشد' })).toBeVisible();
  await page.getByRole('button', { name: 'پاک‌کردن فیلترها' }).click();
  await expect(page.getByText('چراغ خطی لونا')).toBeVisible();
});
