# データ設計（簡易）

## エンティティ一覧

### Account

- id
- name
- category（bank / cash / eMoney）
- balance
- created_at

### BudgetTask

- id
- session_id
- type
- amount
- from_account_id
- to_account_id
- memo
- is_completed
- created_at

### MonthlySession

- id
- salary_date
- salary_amount
- carryover_amount
- budget_amount
- created_at

### TaskTemplate

- id
- name
- tasks: BudgetTask[]
- created_at

## リレーション

- MonthlySession 1 --- \* BudgetTask
- Account 1 --- \* BudgetTask（from / to）
- User 1 --- \* TaskTemplate
