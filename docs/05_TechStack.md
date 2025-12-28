# 技術スタック

## フロントエンド

- Next.js（App Router）
- TypeScript
- React
- UI：Tailwind CSS
- 状態管理：React Hooks / Context API（※仮定：Redux 等は MVP では使用しない）

## バックエンド

- Firebase（BaaS）
  - Firebase Functions（※仮定：将来的に複雑な処理が必要になった場合に使用）
  - 現時点では Next.js Server Actions / API Routes を主に利用

## データベース

- Cloud Firestore（NoSQL）
  - ユーザー
  - 口座（Account）
  - タスク（BudgetTask）
  - 月次セッション（MonthlySession）

## インフラ

- Firebase Hosting（※仮定：Vercel も選択肢だが MVP では Firebase に統一）
- Firebase Emulator Suite（ローカル開発用）

## 認証・認可

- Firebase Authentication
  - メールアドレス + パスワード
  - ※仮定：将来的に Google / Apple ログイン追加可能
- Firestore Security Rules によるユーザー単位のデータアクセス制御
