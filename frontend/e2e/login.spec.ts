import { test, expect } from '@playwright/test';

// E2Eテストの基本構造
// Playwrightでは test.describe を使用
test.describe('ログイン画面 E2E テスト', () => {
  // 各テストの前に実行される準備処理
  test.beforeEach(async ({ page }) => {
    // ログイン画面にアクセス
    await page.goto('/');
  });

  test('ページが正常に表示される', async ({ page }) => {
    // ページタイトルを確認
    await expect(page).toHaveTitle(/BUD/);

    // 主要な要素が表示されることを確認
    await expect(page.getByRole('heading', { name: 'BUD' })).toBeVisible();
    await expect(page.getByText('お子様の英語の芽を育てよう！')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Googleでログイン' })).toBeVisible();
  });

  test('BUDの特徴セクションが表示される', async ({ page }) => {
    // 特徴セクションの確認
    await expect(page.getByText('BUDの特徴')).toBeVisible();
    await expect(page.getByText('困った時のサポート')).toBeVisible();
    await expect(page.getByText('会話の内容を記録')).toBeVisible();
    await expect(page.getByText('フィードバック')).toBeVisible();
  });

  test('初めての方への案内が表示される', async ({ page }) => {
    // 案内セクションの確認
    await expect(page.getByText('初めての方へ')).toBeVisible();
    await expect(page.getByText('Googleでログインすると、')).toBeVisible();
  });

  test('アカウント切り替えボタンが表示される', async ({ page }) => {
    // アカウント切り替えボタンの確認
    await expect(page.getByText('別のGoogleアカウントを使用')).toBeVisible();
    await expect(page.getByText('すでにBUDをご利用の方で、')).toBeVisible();
  });
});
