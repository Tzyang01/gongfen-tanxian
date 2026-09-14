# 翰林二年級上學期數學全冊互動網站 Implementation Plan

> **For agentic workers:** Inline execution only. Do not use subagents. Follow TDD for course navigation, progress, scoring, and numeric visual models.

**Goal:** 將既有「認識公分」網站擴充為涵蓋二年級上學期數學十個單元的故事、語音、動畫與互動學習網站。

**Architecture:** 使用 `course-data.js` 保存十單元、官方小節名稱與原創教學內容；`lesson-engine.js` 只處理選課、單元進度、計算與精確視覺模型；`app.js` 依資料渲染首頁、單元地圖、故事、動畫及題目。所有可判讀的數量、刻度、時間與比例皆由數值資料產生，情境插圖不作為精確答案依據。

**Tech Stack:** 原生 HTML、CSS、ES modules、Web Speech API、localStorage、Node.js test runner、GitHub Pages。

---

### Task 1: 建立全冊課程資料與純函式

**Files:**
- Create: `dist/course-data.js`
- Modify: `dist/lesson-engine.js`
- Modify: `tests/lesson-engine.test.mjs`

- [x] 先新增失敗測試：確認 10 個單元依序存在、小節名稱符合公開目錄、每單元具有故事／語音／視覺資料／互動題。
- [x] 新增失敗測試：確認每個精確視覺模型的數學關係，包括位值、加減、容量比較、兩步驟、乘法群組、鐘面分鐘與面積單位數。
- [x] 執行 `npm test`，確認因新匯出與資料尚不存在而失敗。
- [x] 建立完整 `SEMESTER_COURSE` 及純函式，保留第三單元既有內容並統一資料格式。
- [x] 執行 `npm test`，確認全部通過。

### Task 2: 建立十單元首頁與單元內學習流程

**Files:**
- Modify: `dist/index.html`
- Modify: `dist/app.js`
- Modify: `dist/styles.css`

- [x] 首頁改為「7～8 歲 → 數學 → 二年級上學期」，下方顯示十個可選單元。
- [x] 每個單元呈現小節地圖、完成進度與繼續學習入口。
- [x] 共用故事卡呈現情境、角色對話、故事收束、三步驟、陷阱與口訣。
- [x] 共用語音朗讀該課完整故事與重點；進度依單元分開保存。

### Task 3: 建立資料驅動動畫與互動

**Files:**
- Modify: `dist/app.js`
- Modify: `dist/styles.css`
- Modify: `tests/lesson-engine.test.mjs`

- [x] 為十單元建立數字位值、直式加減、公分、加減關係、容量、兩步驟、乘法群組、鐘面、乘法表與面積覆蓋動畫。
- [x] 每個動畫提供重播按鈕，並支援 `prefers-reduced-motion`。
- [x] 每個學習小節提供可作答題目、即時回饋與單元進度。
- [x] 執行測試與 JavaScript 語法檢查。

### Task 4: 補充原創故事插圖

**Files:**
- Create: `dist/assets/number-market-story.jpg`
- Create: `dist/assets/time-multiplication-story.jpg`
- Create: `dist/assets/capacity-area-story.jpg`
- Modify: `dist/course-data.js`

- [x] 使用內建 ImageGen 產生三張不承擔精確數值判讀的故事情境圖。
- [x] 逐張檢查人物、道具與情境沒有明顯錯誤，再放入專案。
- [x] 每張圖片加上具體替代文字與「精確數學請看動畫」說明。

### Task 5: 驗證並發布

**Files:**
- Verify: `dist/index.html`, `dist/*.js`, `dist/styles.css`, `dist/assets/*`

- [x] 檢查入口、全部本機資產、語法、測試與 Git 變更範圍。
- [x] 啟動本機網站並確認首頁可回應。
- [x] 提交並推送 `main`，再將 `dist` 發布至 `gh-pages`。
- [x] 等待 GitHub Pages 完成，線上確認首頁、資料、樣式與圖片皆可讀取。
