'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth'
import { getTaskTemplates, addTaskTemplate, deleteTaskTemplate } from '../../lib/firestore'
import { TaskTemplate } from '../../lib/types'

export default function Templates() {
  const { user } = useAuth()
  const router = useRouter()
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [newTemplateName, setNewTemplateName] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchTemplates()
  }, [user, router])

  const fetchTemplates = async () => {
    if (!user) return
    try {
      const tmpls = await getTaskTemplates(user.uid)
      setTemplates(tmpls)
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newTemplateName.trim()) return

    try {
      await addTaskTemplate(user.uid, {
        name: newTemplateName,
        tasks: [], // 空で作成
      })
      setNewTemplateName('')
      fetchTemplates()
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!user) return
    if (!confirm('本当に削除しますか？')) return

    try {
      await deleteTaskTemplate(user.uid, id)
      fetchTemplates()
    } catch (error) {
      console.error(error)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">タスクテンプレート</h1>

      <form onSubmit={handleAddTemplate} className="mb-8 space-y-4">
        <div>
          <label className="block mb-2">テンプレート名</label>
          <input
            type="text"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          新規作成
        </button>
      </form>

      <ul className="space-y-2">
        {templates.map((template) => (
          <li
            key={template.id}
            className="flex justify-between items-center p-2 border rounded"
          >
            <span>{template.name} ({template.tasks.length} タスク)</span>
            <button
              onClick={() => handleDeleteTemplate(template.id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}