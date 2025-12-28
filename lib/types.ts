export type AccountCategory = 'bank' | 'cash' | 'eMoney'

export interface Account {
  id: string
  name: string
  category: AccountCategory
  balance: number
  createdAt: Date
}

export interface BudgetTask {
  id: string
  sessionId: string
  type: string
  amount: number
  fromAccountId?: string
  toAccountId?: string
  memo?: string
  isCompleted: boolean
  createdAt: Date
}

export interface MonthlySession {
  id: string
  salaryDate: Date
  salaryAmount: number
  carryoverAmount: number
  budgetAmount: number
  createdAt: Date
}

export interface TaskTemplate {
  id: string
  name: string
  tasks: Omit<BudgetTask, 'id' | 'sessionId' | 'isCompleted' | 'createdAt'>[]
  createdAt: Date
}

export interface AppUser {
  id: string
  defaultTemplateId?: string
  createdAt: Date
}
