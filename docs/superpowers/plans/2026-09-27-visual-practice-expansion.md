# 圖像化練習題擴充實作計畫

> **For agentic workers:** Use an available execution workflow appropriate to the plan. Use subagents only when they are available, authorized, and materially useful. Steps use checkbox (`- [ ]`) syntax when progress tracking helps.

**Goal:** 將每個一般課程從 4 題增加為 8 題、單元總挑戰從 10 題增加為 15 題，並加入數列、圖像分組、位值、直式、算式與生活應用等圖像化題型。

**Architecture:** 擴充 `semester-engine.js` 的題目契約，每題可帶 `responseType` 與 `visual` 規格；題庫仍由課程的精確數學模型生成，不依賴圖片猜答案。`app.js` 根據題目契約呈現圖像與選擇／輸入互動，原有星星、解鎖、重試與 `localStorage` 進度邏輯保持不變。

**Tech Stack:** Vanilla HTML/CSS/ES modules、Node.js `node:test`、Playwright CLI、GitHub Pages。

---

### Task 1: 擴充題目契約與題數

**Files:**
- Modify: `tests/semester-course.test.mjs`
- Modify: `dist/semester-engine.js`

- [x] 先將測試改為一般課程固定 8 題、總挑戰固定 15 題，並要求每課至少 2 題 `responseType: 'input'`、2 題帶 `visual`。
- [x] 執行 `node --test tests/semester-course.test.mjs`，確認現有 4／10 題實作因數量與契約不符而失敗。
- [x] 讓 `practiceQuestion()` 正規化 `responseType` 與 `visual`，並建立各數學模型專屬的圖像練習變體。
- [x] 一般課程合併為 8 題，總挑戰依單元各課交錯抽取 15 題，所有選項唯一且包含正確答案。
- [x] 執行 `node --test tests/semester-course.test.mjs`，確認題數與契約通過。

### Task 2: 加入輸入作答與圖像題卡

**Files:**
- Modify: `dist/index.html`
- Modify: `dist/app.js`
- Modify: `dist/styles.css`
- Modify: `tests/semester-course.test.mjs`

- [x] 先寫 UI 失敗測試，要求 `question-visual`、`question-input`、`question-submit` 與共用作答函式存在。
- [x] 執行 UI 測試，確認因新元件尚未建立而失敗。
- [x] 新增可存取的數字輸入表單，接受半形與全形數字，空白不送出；錯答時留在原題，正確後才前往下一題。
- [x] 新增數列格、百十個積木、直式、物件分組、時鐘／時間線、容量杯數、公分尺與面積方格的 CSS 圖像。
- [x] 保留 48px 觸控區、`aria-live` 回饋、鍵盤 Enter 送出與平板單欄排版。
- [x] 執行 UI 與引擎測試。

### Task 3: 內容、回歸與發布驗收

**Files:**
- Modify only if verification reveals a defect.

- [x] 執行 `npm test`、所有 JavaScript `node --check` 與 `git diff --check`。
- [x] 檢查 10 個單元每個一般課程的 8 題題型分佈，並確認每個總挑戰 15 題。
- [x] 使用 Playwright 在 1024×768 與 768×1024 實際完成一題輸入題、一題圖像選擇題、錯答重試與進度前進。
- [x] 確認無水平溢位、可見按鈕至少 48px，瀏覽器主控台 0 錯誤與 0 警告。
- [x] 提交功能分支，快進合併至 `main`，在合併後重跑完整測試。
- [x] 推送 `main`，以 `git subtree push --prefix dist origin gh-pages` 發布，等待 Pages workflow 成功後檢查公開網址。
