# E2E Testing Guide

## Variable Description Editing Tests

このディレクトリには、Figma Local Variables Editor の変数説明編集機能をテストする E2E テストが含まれています。

### テストファイル

- `variable-description-edit.spec.ts`: `color/text/disabled`変数の説明文の句読点切り替えテスト

### 前提条件

1. **サーバーの起動**: テスト実行前に開発サーバーを起動してください
   ```bash
   npm run dev
   ```
2. **環境変数**: `.env.local`に Figma API トークンが設定されている必要があります

   ```
   FIGMA_TOKEN=your_figma_token_here
   ```

3. **テストファイル**: 有効な Figma ファイルキーが必要です（テストでは空文字列を使用）

### テスト実行方法

#### 1. 全 E2E テストの実行

```bash
# ヘッドレスモードで実行
npm run test:e2e

# ブラウザ表示ありで実行
npm run test:e2e:headed

# UIモードで実行（テスト選択・デバッグ可能）
npm run test:e2e:ui
```

#### 2. 説明編集テストのみ実行

```bash
# ヘッドレスモードで実行
npx playwright test tests/variable-description-edit.spec.ts

# ブラウザ表示ありで実行
npm run test:description-edit

# UIモードで実行
npm run test:description-edit:ui
```

#### 3. 特定のテストケースのみ実行

```bash
# 句読点切り替えテストのみ
npx playwright test tests/variable-description-edit.spec.ts -g "should toggle punctuation"

# 句読点削除テストのみ
npx playwright test tests/variable-description-edit.spec.ts -g "should handle punctuation removal"

# 句読点追加テストのみ
npx playwright test tests/variable-description-edit.spec.ts -g "should handle punctuation addition"

# データ永続化テストのみ
npx playwright test tests/variable-description-edit.spec.ts -g "should verify data persistence"
```

### テストケース詳細

#### 1. `should toggle punctuation in color/text/disabled description`

- 現在の説明文の句読点状態を確認
- 句読点がある場合は削除、ない場合は追加
- 更新ボタンをクリックして変更を保存
- 通知の表示と値の更新を確認

#### 2. `should handle punctuation removal from color/text/disabled description`

- 説明文から句読点を削除
- 更新処理の動作確認

#### 3. `should handle punctuation addition to color/text/disabled description`

- 説明文に句読点を追加
- 更新処理の動作確認

#### 4. `should verify data persistence after page reload`

- 変更後にページをリロード
- データの永続化を確認（API 正常動作時）

### デバッグ方法

#### 1. UI モードでのデバッグ

```bash
npm run test:description-edit:ui
```

- ブラウザでテストを視覚的に確認
- ステップバイステップでの実行
- 要素のハイライト表示

#### 2. ヘッドフルモードでの実行

```bash
npm run test:description-edit
```

- ブラウザの動作を直接確認
- コンソールログの確認

#### 3. 詳細ログの有効化

```bash
DEBUG=pw:api npx playwright test tests/variable-description-edit.spec.ts
```

### 既知の問題

1. **API 404 エラー**: 現在の Figma API 実装では 404 エラーが発生する場合があります

   - テストは通知の表示までを確認
   - 実際のデータ永続化は確認できない場合があります

2. **ポート競合**: 複数のサーバーが起動している場合、ポート番号を確認してください
   - `playwright.config.ts`の`baseURL`を適切なポートに設定

### トラブルシューティング

#### サーバーが起動していない

```
Error: connect ECONNREFUSED ::1:3000
```

→ `npm run dev`でサーバーを起動してください

#### 要素が見つからない

```
TimeoutError: Locator expected to be visible
```

→ データ読み込み完了を待つか、セレクターを確認してください

#### API 認証エラー

```
Error: Request failed with status code 403
```

→ `.env.local`の FIGMA_TOKEN を確認してください

### レポート確認

テスト実行後、詳細なレポートを確認できます：

```bash
npx playwright show-report
```
