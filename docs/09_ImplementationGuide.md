# 実装ガイド（Implementation Guide）

本ドキュメントは、家計タスク管理アプリのMVPを
**Next.js + Firebase** を用いて実装するための具体的な実装ガイドである。

---

## 1. 実装方針

- 採用アーキテクチャ：
  - フロントエンド：Next.js（App Router）
  - 状態管理：React Hooks + ViewModel 相当のカスタム Hooks
  - バックエンド：Firebase（Firestore / Auth）
- 状態管理の方針：
  - 画面状態は各 ViewModel Hook に集約
  - グローバル状態は最小限（Session / Accounts）
- データ永続化の方針：
  - Firestore（ユーザー単位のドキュメント構成）
- 画面遷移の管理方法：
  - Next.js App Router（`/home`, `/settings`, `/accounts` 等）

※仮定：MVPではオフライン完全対応は行わない

---

## 2. 実装順序（推奨）

1. Firebase プロジェクト作成・初期設定
2. Firestore データ構造設計
3. Repository 層（Firestore アクセスラッパー）
4. ビジネスロジック（BalanceCalculator）
5. ViewModel Hooks
6. UI（ページ / コンポーネント）
7. 認証・ルーティング制御
8. 動作確認・微調整

---

## 3. 画面別 実装ガイド

### 3.1 初回設定画面

#### 実装対象

- Page：`/setup/page.tsx`
- Hook：`useInitialSetup`

#### 主な処理

- Firebase Auth で匿名 or メールログイン
- 初期口座データ作成
- 初回 MonthlySession 作成

#### 注意点

- 初回設定完了フラグを Firestore に保存
- 未設定ユーザーは常に `/setup` にリダイレクト

---

### 3.2 ホーム画面

#### 実装対象

- Page：`/home/page.tsx`
- Hook：`useHomeViewModel`

#### 主な処理

- 今月の MonthlySession を Firestore から取得
- タスク一覧表示
- タスク完了処理
- 残高即時反映
- ATM必要額の計算

#### 注意点

- 残高更新ロジックは Hook 内で完結させる
- UI コンポーネントは計算ロジックを持たない

---

### 3.3 タスク詳細／編集画面

#### 実装対象

- Page：`/tasks/[taskId]/page.tsx`
- Hook：`useTaskDetailViewModel`

#### 主な処理

- タスク取得・編集
- 保存／削除

#### 注意点

- 新規作成時は `taskId = new` 扱い
- Firestore 更新は保存時のみ

---

### 3.4 タスク追加画面

#### 実装対象

- Page：`/tasks/new/page.tsx`
- Hook：`useTaskAddViewModel`

#### 主な処理

- タスク種別選択
- 初期値入りタスク生成
- 詳細画面へ遷移

---

### 3.5 月次設定画面

#### 実装対象

- Page：`/settings/monthly/page.tsx`
- Hook：`useMonthlySettingViewModel`

#### 主な処理

- 給与日・予算設定
- 月次テンプレート適用

#### 注意点

- テンプレ適用は重複防止ロジック必須
- 再適用時は差分のみ追加

---

### 3.6 口座管理画面

#### 実装対象

- Page：`/accounts/page.tsx`
- Hook：`useAccountManagementViewModel`

#### 主な処理

- 口座一覧表示
- 残高修正
- 口座追加・削除

#### 注意点

- 残高修正は「手動補正」として履歴に残す（※仮定）

---

## 4. データ更新フロー

- Firestore 更新は必ず Repository 経由
- タスク完了時の処理順：
  1. タスク取得
  2. BalanceCalculator で新残高計算
  3. Account ドキュメント更新
  4. Task ドキュメントを完了状態に更新

※仮定：トランザクションは Firestore Transaction を使用

---

## 5. エラーハンドリング方針

- 入力エラー：
  - 金額未入力・負数 → 保存不可（UI バリデーション）
- データ不整合：
  - 残高不足 → 警告表示のみ（実行は許可）
- 想定外ケース：
  - console.error + Firebase Logging（※仮定）

---

## 6. MVPでは省略する実装

- オフライン完全対応
- プッシュ通知
- iCloud / 複数端末同期最適化
- Undo / Redo
- 高度な分析・グラフ

---

## 7. 実装完了の判定基準

- タスク完了時に Firestore 上の残高が正しく更新される
- ページ再読み込み後も状態が保持される
- 1か月分の給与日作業を問題なく完遂できる
