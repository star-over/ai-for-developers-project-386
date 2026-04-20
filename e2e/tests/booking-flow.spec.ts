import { test, expect } from '@playwright/test';

test('гость бронирует слот', async ({ page }) => {
  await test.step('открыть каталог типов событий', async () => {
    await page.goto('/booking');
    await expect(page.getByRole('heading', { name: 'Выберите тип встречи' })).toBeVisible();
  });

  const eventCard = page.getByText('Consultation');

  await test.step('выбрать тип события', async () => {
    await expect(eventCard).toBeVisible();
    await eventCard.click();
    await expect(page).toHaveURL(/\/booking\/.+/);
  });

  await test.step('выбрать дату и слот', async () => {
    // Ждём загрузки слотов — кнопки с временем в формате HH:MM
    const slotButton = page.locator('button:not([disabled])').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await expect(slotButton).toBeVisible({ timeout: 10_000 });
    await slotButton.click();
  });

  await test.step('заполнить форму и забронировать', async () => {
    // Модалка открывается автоматически после выбора слота
    const nameInput = page.locator('#guestName');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Тест Юзер');
    await page.locator('#guestEmail').fill('test@example.com');
    await page.getByRole('button', { name: 'Записаться' }).click();
  });

  await test.step('увидеть подтверждение', async () => {
    await expect(page.getByText('Бронирование создано!')).toBeVisible();
  });
});
