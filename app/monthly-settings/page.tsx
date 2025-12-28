'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth'
import {
  getMonthlySessions,
  updateMonthlySession,
  getTaskTemplates,
  addBudgetTask,
  getBudgetTasks,
  createNewMonthlySession,
} from '../../lib/firestore'
import { MonthlySession, TaskTemplate } from '../../lib/types'

export default function MonthlySettings() {
  const { user } = useAuth()
  const router = useRouter()
  const [session, setSession] = useState<MonthlySession | null>(null)
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{[key: string]: string}>({})
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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    if (!form.salaryDate) {
      newErrors.salaryDate = '給与日を選択してください'
    }
    if (!form.salaryAmount || isNaN(Number(form.salaryAmount)) || Number(form.salaryAmount) <= 0) {
      newErrors.salaryAmount = '有効な給与額を入力してください'
    }
    if (form.carryoverAmount && (isNaN(Number(form.carryoverAmount)))) {
      newErrors.carryoverAmount = '有効な前月繰越額を入力してください'
    }
    if (!form.budgetAmount || isNaN(Number(form.budgetAmount)) || Number(form.budgetAmount) <= 0) {
      newErrors.budgetAmount = '有効な今月の予算を入力してください'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !session) return

    if (!validateForm()) return

    setLoading(true)
    setMessage('')
    try {
      await updateMonthlySession(user.uid, session.id, {
        salaryDate: new Date(form.salaryDate),
        salaryAmount: parseInt(form.salaryAmount),
        carryoverAmount: parseInt(form.carryoverAmount),
        budgetAmount: parseInt(form.budgetAmount),
      })
      setMessage('保存しました')
      setTimeout(() => router.push('/'), 1000)
    } catch (error) {
      console.error(error)
      setMessage('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTemplate = async () => {
    if (!user || !session || !selectedTemplateId) return

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
    if (!selectedTemplate) return

    setLoading(true)
    setMessage('')
    try {
      // Get existing tasks to avoid duplicates
      const existingTasks = await getBudgetTasks(user.uid, session.id)
      const existingTaskKeys = new Set(
        existingTasks.map(t => `${t.type}-${t.amount}-${t.memo || ''}-${t.fromAccountId || ''}-${t.toAccountId || ''}`)
      )

      for (const task of selectedTemplate.tasks) {
        const taskKey = `${task.type}-${task.amount}-${task.memo || ''}-${task.fromAccountId || ''}-${task.toAccountId || ''}`
        if (!existingTaskKeys.has(taskKey)) {
          await addBudgetTask(user.uid, {
            ...task,
            sessionId: session.id,
            isCompleted: false,
          })
        }
      }
      setMessage('テンプレートを適用しました')
      setTimeout(() => router.push('/'), 1000)
    } catch (error) {
      console.error(error)
      setMessage('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleStartNewMonth = async () => {
    if (!user || !session) return

    setLoading(true)
    setMessage('')
    try {
      await createNewMonthlySession(user.uid, session)
      setMessage('新しい月を開始しました')
      setTimeout(() => router.push('/'), 1000)
    } catch (error) {
      console.error(error)
      setMessage('エラーが発生しました')
    } finally {
      setLoading(false)
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
      {message && <p className={`mb-4 ${message.includes('エラー') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
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
          {errors.salaryDate && <p className="text-red-500 text-sm mt-1">{errors.salaryDate}</p>}
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
          {errors.salaryAmount && <p className="text-red-500 text-sm mt-1">{errors.salaryAmount}</p>}
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
          {errors.carryoverAmount && <p className="text-red-500 text-sm mt-1">{errors.carryoverAmount}</p>}
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
          {errors.budgetAmount && <p className="text-red-500 text-sm mt-1">{errors.budgetAmount}</p>}
        </div>
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? '保存中...' : '保存'}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">新しい月を開始</h2>
        <p className="mb-4">現在の設定を引き継いで新しい月次セッションを作成し、デフォルトテンプレートを適用します。</p>
        <button
          onClick={handleStartNewMonth}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? '作成中...' : '新しい月を開始'}
        </button>
      </div>

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
            disabled={loading || !selectedTemplateId}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? '適用中...' : '適用'}
          </button>
        </div>
      </div>
    </main>
  )
}