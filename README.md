# CashFlowTodo

家計管理を楽にするタスク管理アプリ。

## 機能

- 月次予算とタスク管理
- 口座残高の自動更新
- ATM必要額の計算
- タスクテンプレート

## セットアップ

1. Firebaseプロジェクトを作成
2. FirestoreとAuthenticationを有効化
3. .env.localにFirebase設定を記述
4. npm install
5. npm run build
6. firebase deploy

## 使い方

1. 初回設定で口座と月次情報を登録
2. ホームでタスクを管理
3. タスク完了で残高が自動更新

## 技術スタック

- Next.js 14 (App Router)
- Firebase (Firestore, Auth)
- Tailwind CSS
- TypeScript