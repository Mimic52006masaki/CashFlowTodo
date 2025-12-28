'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth'
import { addAccount, addMonthlySession } from '../../lib/firestore'

export default function InitialSetup() {
  const { user } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    accountName: '',
    initialBalance: '',
    salaryDate: '',
    salaryAmount: '',
    carryoverAmount: '',
    budgetAmount: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await addAccount(user.uid, {
        name: form.accountName,
        category: 'bank',
        balance: parseInt(form.initialBalance),
      })
      await addMonthlySession(user.uid, {
        salaryDate: new Date(form.salaryDate),
        salaryAmount: parseInt(form.salaryAmount),
        carryoverAmount: parseInt(form.carryoverAmount),
        budgetAmount: parseInt(form.budgetAmount),
      })
      router.push('/')
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">初回設定</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">口座名</label>
          <input
            type="text"
            name="accountName"
            value={form.accountName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">初期残高</label>
          <input
            type="number"
            name="initialBalance"
            value={form.initialBalance}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">給与日</label>
          <input
            type="date"
            name="salaryDate"
            value={form.salaryDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">給与額</label>
          <input
            type="number"
            name="salaryAmount"
            value={form.salaryAmount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">前月繰越額</label>
          <input
            type="number"
            name="carryoverAmount"
            value={form.carryoverAmount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">今月の予算</label>
          <input
            type="number"
            name="budgetAmount"
            value={form.budgetAmount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          保存
        </button>
      </form>
    </main>
  )
}