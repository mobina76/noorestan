import { expect, test } from '@playwright/test';

test('catalog supports search, category filtering, and recovery', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByText('چراغ دانلايت توكار گرد آريانا')).toBeVisible();
  await page.getByLabel('جست‌وجوی محصول').fill('آریانا');
  await expect(page.getByText('چراغ دانلايت مربعي توكار آريانا')).toBeVisible();
  await expect(page.getByText('لونا', { exact: true })).toHaveCount(0);
  await page.getByLabel('جست‌وجوی محصول').fill('محصول-غیرموجود-تستی');
  await expect(page.getByRole('heading', { name: 'نتیجه‌ای پیدا نشد' })).toBeVisible();
  await page.getByRole('button', { name: 'پاک‌کردن فیلترها' }).click();
  await expect(page.getByText('چراغ دانلايت توكار گرد آريانا')).toBeVisible();
});

test('category filter narrows results to the selected category', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('button', { name: /چراغ ریلی/ }).click();
  await expect(page.getByText('نواترن ريلي قطر 9')).toBeVisible();
  await expect(page.getByText('چراغ دانلايت توكار گرد آريانا')).toHaveCount(0);
});
