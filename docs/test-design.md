# フロントエンドテスト設計書

## テスト方針

### 基本方針

- **Unit Test (Vitest)**: コンポーネントの動作、ロジックの検証
- **E2E Test (Playwright)**: 実際のユーザーフローの検証
- 重要度の高い機能（認証、ナビゲーション）を優先的にテスト

### テスト戦略

- **ホーム画面（ログイン機能）**: Vitest + Playwright 両方で重点テスト
- **子ども選択画面**: Vitest で基本テスト、Playwright で E2E フロー確認

## カバレッジ目標

- **Unit Test カバレッジ**: 60%以上
- **E2E Test**: 主要ユーザーフロー 100%カバー

## テストケース一覧

### Unit Test (Vitest)

#### ホーム画面（ログイン機能）

- [ ] コンポーネントが正常にレンダリングされる
- [ ] フォームバリデーションが正しく動作する
- [ ] API 呼び出しが適切にモックされる
- [ ] エラーハンドリングが正しく動作する

#### 子ども選択画面

- [ ] コンポーネントが正常にレンダリングされる
- [ ] 子ども一覧の表示ロジックが正しく動作する

### E2E Test (Playwright)

#### 認証フロー

- [ ] 正常なログインフローが完了する
- [ ] ログイン失敗時の適切なエラー表示
- [ ] ログイン後の画面遷移

#### 子ども選択フロー

- [ ] 子ども選択から次画面への遷移
- [ ] 選択状態の保持

## 使用ツール

- **Unit Test**: Vitest + @testing-library/react
- **E2E Test**: Playwright
- **モック**: vi.mock (Vitest)
- **カバレッジ**: Vitest Coverage

## ファイル構成

```
frontend/
├── src/
│ ├── test/
│ │ └── setup.ts
│ └── __tests__/ # Unit テストファイル
│ ├── components/
│ └── pages/
├── e2e/ # E2E テストファイル
│ ├── login.spec.ts
│ └── child-select.spec.ts
├── vitest.config.ts
└── playwright.config.ts
```
