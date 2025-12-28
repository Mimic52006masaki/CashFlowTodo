'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth'
import {
  getBudgetTasks,
  getAccounts,
  getMonthlySessions,
  updateBudgetTask,
  deleteBudgetTask,
} from '../../../lib/firestore'
import { Account, BudgetTask, MonthlySession } from '../../../lib/types'

export default function TaskEdit({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [task, setTask] = useState<BudgetTask | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [session, setSession] = useState<MonthlySession | null>(null)
  const [form, setForm] = useState({
    amount: '',
    fromAccountId: '',
    toAccountId: '',
    memo: '',
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchData()
  }, [user, router])

  const fetchData = async () => {
    if (!user) return
    try {
      const accs = await getAccounts(user.uid)
      setAccounts(accs)
      const sessions = await getMonthlySessions(user.uid)
      if (sessions.length > 0) {
        const currentSession = sessions[0]
        setSession(currentSession)
        const tasks = await getBudgetTasks(user.uid, currentSession.id)
        const foundTask = tasks.find((t) => t.id === params.id)
        if (foundTask) {
          setTask(foundTask)
          setForm({
            amount: foundTask.amount.toString(),
            fromAccountId: foundTask.fromAccountId || '',
            toAccountId: foundTask.toAccountId || '',
            memo: foundTask.memo || '',
          })
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !task) return

    try {
      await updateBudgetTask(user.uid, task.id, {
        amount: parseInt(form.amount),
        fromAccountId: form.fromAccountId || undefined,
        toAccountId: form.toAccountId || undefined,
        memo: form.memo,
      })
      router.push('/')
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async () => {
    if (!user || !task) return
    try {
      await deleteBudgetTask(user.uid, task.id)
      router.push('/')
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  if (!user || !task || !session) {
    return <div>Loading...</div>
  }

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">タスク編集 ({task.type})</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">金額</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        {(task.type === 'withdraw' || task.type === 'transfer') && (
          <div>
            <label className="block mb-2">出金元口座</label>
            <select
              name="fromAccountId"
              value={form.fromAccountId}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">選択</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {(task.type === 'deposit' || task.type === 'transfer' || task.type === 'charge') && (
          <div>
            <label className="block mb-2">入金先口座</label>
            <select
              name="toAccountId"
              value={form.toAccountId}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">選択</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block mb-2">メモ</label>
          <input
            type="text"
            name="memo"
            value={form.memo}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex space-x-4">
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            保存
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            削除
          </button>
        </div>
      </form>
    </main>
  )
}