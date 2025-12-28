'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth'
import {
  getMonthlySessions,
  updateMonthlySession,
  getTaskTemplates,
  addBudgetTask,
} from '../../lib/firestore'
import { MonthlySession, TaskTemplate } from '../../lib/types'

export default function MonthlySettings() {
  const { user } = useAuth()
  const router = useRouter()
  const [session, setSession] = useState<MonthlySession | null>(null)
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [form, setForm] = useState({
    salaryDate: '',
    salaryAmount: '',
    carryoverAmount: '',
    budgetAmount: '',
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
      const tmpls = await getTaskTemplates(user.uid)
      setTemplates(tmpls)
      const sessions = await getMonthlySessions(user.uid)
      if (sessions.length > 0) {
        const currentSession = sessions[0]
        setSession(currentSession)
        setForm({
          salaryDate: currentSession.salaryDate.toISOString().split('T')[0],
          salaryAmount: currentSession.salaryAmount.toString(),
          carryoverAmount: currentSession.carryoverAmount.toString(),
          budgetAmount: currentSession.budgetAmount.toString(),
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !session) return

    try {
      await updateMonthlySession(user.uid, session.id, {
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

  const handleApplyTemplate = async () => {
    if (!user || !session || !selectedTemplateId) return

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
    if (!selectedTemplate) return

    try {
      for (const task of selectedTemplate.tasks) {
        await addBudgetTask(user.uid, {
          ...task,
          sessionId: session.id,
          isCompleted: false,
        })
      }
      router.push('/')
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  if (!user || !session) {
    return <div>Loading...</div>
  }

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">月次設定</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">テンプレート適用</h2>
        <div className="space-y-4">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">テンプレートを選択</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplateId}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            適用
          </button>
        </div>
      </div>
    </main>
  )
}