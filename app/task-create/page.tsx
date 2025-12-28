'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../lib/auth'
import { getAccounts, getMonthlySessions, addBudgetTask } from '../../lib/firestore'
import { Account, MonthlySession } from '../../lib/types'

export default function TaskCreate() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'withdraw'

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
        setSession(sessions[0])
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !session) return

    try {
      await addBudgetTask(user.uid, {
        sessionId: session.id,
        type,
        amount: parseInt(form.amount),
        fromAccountId: form.fromAccountId || undefined,
        toAccountId: form.toAccountId || undefined,
        memo: form.memo,
        isCompleted: false,
      })
      router.push('/')
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  if (!user || !session) {
    return <div>Loading...</div>
  }

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">タスク作成 ({type})</h1>
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
        {(type === 'withdraw' || type === 'transfer') && (
          <div>
            <label className="block mb-2">出金元口座</label>
            <select
              name="fromAccountId"
              value={form.fromAccountId}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
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
        {(type === 'deposit' || type === 'transfer' || type === 'charge') && (
          <div>
            <label className="block mb-2">入金先口座</label>
            <select
              name="toAccountId"
              value={form.toAccountId}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
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
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          保存
        </button>
      </form>
    </main>
  )
}