# 非機能要件

## パフォーマンス
- 想定同時接続数：
  - 数十〜数百人規模（MVP想定）
- レスポンスタイム目標：
  - 通常操作で1秒以内

## セキュリティ
- 認証方式：
  - Firebase Authentication
- データ保護方針：
  - Firestore Security Rules により user_id 単位で制御

## 可用性・運用
- 障害時の対応：
  - Firebase / Vercel のマネージド機能に依存
- ログ・監視：
  - Firebase標準ログを利用（※仮定）
