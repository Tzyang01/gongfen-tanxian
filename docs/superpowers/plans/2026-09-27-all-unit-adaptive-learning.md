# 二上數學全單元適性引導實作計畫

> **For agentic workers:** Use an available execution workflow appropriate to the plan. Use subagents only when they are available, authorized, and materially useful. Steps use checkbox (`- [x]`) syntax when progress tracking helps.

**Goal:** 讓二年級上學期 10 個數學單元全部擁有與第 4 單元同等的適性引導學習、精熟判定、場景修復與家長報告。

**Architecture:** 將現有第 4 單元硬編碼資料拆成共用題目工廠、每單元獨立資料模組與學期級索引。UI 只依賴目前單元的統一介面，學習者進度使用全學期唯一的 skill ID，並相容於已保存的第 4 單元資料。

**Tech Stack:** Vanilla HTML/CSS/ES modules、Node.js `node:test`、`localStorage`、GitHub Pages。

---

### Task 1: 全單元資料契約與共用題目工廠

**Files:**
- Create: `dist/adaptive/question-factory.js`
- Create: `dist/adaptive-course-data.js`
- Create: `tests/adaptive-course-data.test.mjs`
- Modify: `dist/unit4-adaptive-data.js`

- [x] 先寫失敗測試：`ADAPTIVE_COURSE.units` 應依序含 `unit-1` 到 `unit-10`，每單元 3 項能力、每能力 8 題、每題 5 步、每個作答步驟 3 層提示，選項唯一且包含答案。
- [x] 執行 `node --test tests/adaptive-course-data.test.mjs`，確認因全單元 API 尚未存在而失敗。
- [x] 建立 `createGuidedQuestion()` 與 `createSkill()`，將單題統一為 `listen/concept/model/method/answer` 五步。
- [x] 建立 `ADAPTIVE_COURSE` 與 `getAdaptiveUnit(unitId)`，先納入第 4 單元，並由 `unit4-adaptive-data.js` 重新匯出相容常數。
- [x] 執行資料測試，確認只剩尚未建立的單元失敗。

### Task 2: 第 1、2、3 單元適性題庫

**Files:**
- Create: `dist/adaptive/unit-1.js`
- Create: `dist/adaptive/unit-2.js`
- Create: `dist/adaptive/unit-3.js`
- Modify: `dist/adaptive-course-data.js`

- [x] 第 1 單元建立「數序與跨十」「百十個位值」「用錢表示數」三項能力，各 8 個不同情境。
- [x] 第 2 單元建立「進位加法」「退位減法」「數的大小比較」三項能力，各 8 個不同情境。
- [x] 第 3 單元建立「公平測量」「讀尺與畫線」「長度加減」三項能力，各 8 個不同情境。
- [x] 執行 `node --test tests/adaptive-course-data.test.mjs`，確認前四單元全部通過契約。

### Task 3: 第 5、6、7 單元適性題庫

**Files:**
- Create: `dist/adaptive/unit-5.js`
- Create: `dist/adaptive/unit-6.js`
- Create: `dist/adaptive/unit-7.js`
- Modify: `dist/adaptive-course-data.js`

- [x] 第 5 單元建立「認識容量」「直接倒入比較」「共同單位比較」三項能力，各 8 題。
- [x] 第 6 單元建立「依序兩次增加」「依序兩次減少」「加減混合兩步驟」三項能力，各 8 題。
- [x] 第 7 單元建立「幾的幾倍」「2 與 5 的乘法」「4 的乘法」三項能力，各 8 題。
- [x] 執行資料契約與既有引擎測試。

### Task 4: 第 8、9、10 單元適性題庫

**Files:**
- Create: `dist/adaptive/unit-8.js`
- Create: `dist/adaptive/unit-9.js`
- Create: `dist/adaptive/unit-10.js`
- Modify: `dist/adaptive-course-data.js`

- [x] 第 8 單元建立「鐘面與指針」「報讀時刻」「經過時間」三項能力，各 8 題。
- [x] 第 9 單元建立「3 的乘法」「6 的乘法」「7 的乘法」三項能力，各 8 題。
- [x] 第 10 單元建立「重疊直接比較」「相同方格比較」「方格排列與計數」三項能力，各 8 題。
- [x] 執行資料契約，確認總數為 10 單元、30 項能力、240 個原創情境、1,200 個引導步驟。

### Task 5: 將第 4 單元專用 UI 改成全單元共用

**Files:**
- Modify: `dist/app.js`
- Modify: `dist/index.html`
- Modify: `dist/styles.css`
- Modify: `tests/adaptive-ui.test.mjs`
- Modify: `tests/adaptive-engine.test.mjs`

- [x] 先寫失敗測試：每個單元都能取得適性入口，UI 不再匯入 `UNIT4_ADAPTIVE`，返回按鈕使用目前單元，家長報告依單元分組。
- [x] 確認 UI 測試以現有第 4 單元硬編碼實作失敗。
- [x] 改用 `ADAPTIVE_COURSE`、`activeAdaptiveUnit`與全學期 `skillIds`，動態呈現單元名稱、步驟標籤、場景與返回位置。
- [x] 將家長報告改為十個單元折疊區塊，每區只顯示能力狀態、常見錯誤與下次建議。
- [x] 擴充錯誤標籤對應，讓 30 項能力的家長報告使用台灣慣用語。
- [x] 執行引擎、資料與 UI 測試。

### Task 6: 全站驗收與 GitHub Pages 發布

**Files:**
- Modify only if verification reveals a defect.

- [x] 執行 `npm test`、三類 JavaScript 語法檢查與 `git diff --check`。
- [x] 以真實瀏覽器在 1024×768 與 768×1024 驗證第 1、3、5、6、7、8、9、10 單元入口，至少完整跑過一個非第 4 單元的提示、連續兩題精熟、重新載入與家長報告流程。
- [x] 檢查可見按鈕至少 48px、沒有水平溢位、瀏覽器主控台 0 錯誤與 0 警告。
- [x] 提交功能分支，快進合併至 `main`，在合併後重跑完整測試。
- [x] 推送 `main`，用 `git subtree push --prefix dist origin gh-pages` 發布，等待 Pages workflow 成功。
- [x] 從公開網址檢查全單元資料模組、主程式與首頁均為 HTTP 200，並確認全單元入口已上線。
