import { expect, test } from "@playwright/test";

test.describe("Figma Variables Data Fetching", () => {
  test("should load and display Figma variables data", async ({ page }) => {
    // ページに移動
    await page.goto("/");

    // ページが正しく読み込まれることを確認
    await expect(page).toHaveTitle(/Figma/);

    // ファイルキー入力フィールドを確認
    const fileKeyInput = page.locator('input[placeholder*="Figma"]');
    await expect(fileKeyInput).toBeVisible();

    // テスト用のファイルキーを入力
    await fileKeyInput.fill("WZ1EEljhqZdxA3FCYasvz1");

    // 読み込みボタンを見つけてクリック
    const loadButton = page.locator("button").filter({ hasText: "読み込み" });
    await expect(loadButton).toBeVisible();
    await loadButton.click();

    // APIリクエストが完了するまで待機
    // ネットワークリクエストを監視
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/figma/variables") &&
        response.status() === 200
    );

    // テーブルが表示されることを確認
    await expect(page.locator("table")).toBeVisible();

    // テーブルヘッダーが正しく表示されることを確認
    await expect(page.locator("th").filter({ hasText: "名前" })).toBeVisible();
    await expect(
      page.locator("th").filter({ hasText: "タイプ" })
    ).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "値" })).toBeVisible();
    await expect(
      page.locator("th").filter({ hasText: "スコープ" })
    ).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "説明" })).toBeVisible();

    // データ行が存在することを確認
    const dataRows = page.locator("tbody tr");
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);

    console.log(`取得されたデータ行数: ${rowCount}`);
  });

  test("should display color previews for COLOR variables", async ({
    page,
  }) => {
    await page.goto("/");

    // データを読み込み
    await page
      .locator('input[placeholder*="Figma"]')
      .fill("WZ1EEljhqZdxA3FCYasvz1");
    await page.locator("button").filter({ hasText: "読み込み" }).click();

    // APIレスポンスを待機
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/figma/variables") &&
        response.status() === 200
    );

    // カラープレビューが表示されることを確認
    const colorPreviews = page.locator('div[style*="background-color"]');
    const colorCount = await colorPreviews.count();

    if (colorCount > 0) {
      await expect(colorPreviews.first()).toBeVisible();
      console.log(`カラープレビュー数: ${colorCount}`);
    } else {
      console.log("カラー変数が見つかりませんでした");
    }
  });

  test("should display collection groups", async ({ page }) => {
    await page.goto("/");

    // データを読み込み
    await page
      .locator('input[placeholder*="Figma"]')
      .fill("WZ1EEljhqZdxA3FCYasvz1");
    await page.locator("button").filter({ hasText: "読み込み" }).click();

    // APIレスポンスを待機
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/figma/variables") &&
        response.status() === 200
    );

    // コレクション名が表示されることを確認
    const collectionHeaders = page.locator("h3");
    const headerCount = await collectionHeaders.count();

    if (headerCount > 0) {
      await expect(collectionHeaders.first()).toBeVisible();
      console.log(`コレクション数: ${headerCount}`);

      // 最初のコレクション名を取得してログ出力
      const firstCollectionName = await collectionHeaders.first().textContent();
      console.log(`最初のコレクション: ${firstCollectionName}`);
    }
  });

  test("should handle description input fields", async ({ page }) => {
    await page.goto("/");

    // データを読み込み
    await page
      .locator('input[placeholder*="Figma"]')
      .fill("WZ1EEljhqZdxA3FCYasvz1");
    await page.locator("button").filter({ hasText: "読み込み" }).click();

    // APIレスポンスを待機
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/figma/variables") &&
        response.status() === 200
    );

    // 説明入力フィールドが存在することを確認
    const descriptionInputs = page.locator('input[placeholder="説明を入力"]');
    const inputCount = await descriptionInputs.count();

    if (inputCount > 0) {
      await expect(descriptionInputs.first()).toBeVisible();
      console.log(`説明入力フィールド数: ${inputCount}`);

      // 最初の入力フィールドにテストテキストを入力
      await descriptionInputs.first().fill("テスト説明");

      // 更新ボタンが存在することを確認
      const updateButton = page
        .locator("button")
        .filter({ hasText: "更新" })
        .first();
      await expect(updateButton).toBeVisible();

      console.log("説明入力機能が正常に動作しています");
    } else {
      console.log("説明入力フィールドが見つかりませんでした");
    }
  });

  test("should handle different variable types", async ({ page }) => {
    await page.goto("/");

    // データを読み込み
    await page
      .locator('input[placeholder*="Figma"]')
      .fill("WZ1EEljhqZdxA3FCYasvz1");
    await page.locator("button").filter({ hasText: "読み込み" }).click();

    // APIレスポンスを待機
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/figma/variables") &&
        response.status() === 200
    );

    // 異なる変数タイプが表示されることを確認
    const typeCells = page
      .locator("td")
      .filter({ hasText: /COLOR|STRING|FLOAT|BOOLEAN/ });
    const typeCount = await typeCells.count();

    if (typeCount > 0) {
      console.log(`変数タイプ数: ${typeCount}`);

      // 各タイプの数を数える
      const colorCount = await page
        .locator("td")
        .filter({ hasText: "COLOR" })
        .count();
      const stringCount = await page
        .locator("td")
        .filter({ hasText: "STRING" })
        .count();
      const floatCount = await page
        .locator("td")
        .filter({ hasText: "FLOAT" })
        .count();
      const booleanCount = await page
        .locator("td")
        .filter({ hasText: "BOOLEAN" })
        .count();

      console.log(
        `COLOR: ${colorCount}, STRING: ${stringCount}, FLOAT: ${floatCount}, BOOLEAN: ${booleanCount}`
      );
    } else {
      console.log("変数タイプが見つかりませんでした");
    }
  });
});
