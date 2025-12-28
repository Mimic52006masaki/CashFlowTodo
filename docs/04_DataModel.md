# データ設計（簡易）

## テーブル一覧

### User
- id
- auth_type（google / anonymous）
- created_at

### Account
- id
- user_id
- name
- initial_balance
- color
- created_at

### TransferTodo
- id
- user_id
- from_account_id
- to_account_id
- amount
- memo
- order
- is_completed

## リレーション
- User 1 --- * Account
- User 1 --- * TransferTodo
