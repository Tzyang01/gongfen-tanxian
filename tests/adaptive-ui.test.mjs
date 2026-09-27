import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');

test('第四單元提供引導式入口與一步一畫面', () => {
  for (const id of ['adaptive-entry', 'adaptive-view', 'adaptive-skill-list', 'adaptive-question', 'adaptive-options', 'adaptive-feedback']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(app, /UNIT4_ADAPTIVE/);
  assert.match(app, /createGuidedSession/);
  assert.match(app, /currentGuidedStep/);
  assert.match(app, /persistAdaptiveSession/);
});

test('頁首可切換學習者並經大人驗證開啟家長報告', () => {
  for (const id of ['profile-button', 'profile-dialog', 'adult-gate', 'parent-report', 'parent-report-button']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(app, /grade2-semester1-learners-v2/);
  assert.match(app, /restoreLearnerStore/);
  assert.match(app, /buildParentReport/);
  assert.match(app, /escapeHtml\(profile\.nickname\)/);
});

test('平板互動提供至少 48px 觸控區並不只用顏色傳達狀態', () => {
  assert.match(css, /button\s*\{[^}]*min-height:\s*48px/s);
  assert.match(css, /\.adaptive-option[^}]*min-height:\s*48px/s);
  assert.match(html, /id="adaptive-feedback"[^>]*aria-live="polite"/);
  assert.match(app, /答對了/);
  assert.match(app, /需要一個小線索/);
});
