'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth'
import {
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
} from '../../lib/firestore'
import { Account, AccountCategory } from '../../lib/types'

export default function AccountManagement() {
  const { user } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [form, setForm] = useState<{
    name: string
    category: AccountCategory
    balance: string
  }>({
    name: '',
    category: 'bank',
    balance: '',
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchAccounts()
  }, [user, router])

  const fetchAccounts = async () => {
    if (!user) return
    try {
      const accs = await getAccounts(user.uid)
      setAccounts(accs)
    } catch (error) {
      console.error(error)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await addAccount(user.uid, {
        name: form.name,
        category: form.category,
        balance: parseInt(form.balance),
      })
      fetchAccounts()
      setForm({ name: '', category: 'bank', balance: '' })
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = (account: Account) => {
    setEditingId(account.id)
    setForm({
      name: account.name,
      category: account.category,
      balance: account.balance.toString(),
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !editingId) return

    try {
      await updateAccount(user.uid, editingId, {
        name: form.name,
        category: form.category,
        balance: parseInt(form.balance),
      })
      fetchAccounts()
      setEditingId(null)
      setForm({ name: '', category: 'bank', balance: '' })
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteClick = (id: string) => {
    setConfirmingId(id)
  }

  const handleConfirmDelete = async () => {
    if (!user || !confirmingId) return
    try {
      await deleteAccount(user.uid, confirmingId)
      fetchAccounts()
      setConfirmingId(null)
    } catch (error) {
      console.error(error)
    }
  }

  const handleCancelDelete = () => {
    setConfirmingId(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: name === 'category' ? (value as AccountCategory) : value,
    })
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">口座管理</h1>

      <form onSubmit={editingId ? handleUpdate : handleAdd} className="mb-8 space-y-4">
        <div>
          <label className="block mb-2">口座名</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">カテゴリ</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="bank">銀行</option>
            <option value="cash">現金</option>
            <option value="eMoney">電子マネー</option>
          </select>
        </div>
        <div>
          <label className="block mb-2">残高</label>
          <input
            type="number"
            name="balance"
            value={form.balance}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editingId ? '更新' : '追加'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm({ name: '', category: 'bank', balance: '' })
            }}
            className="ml-4 bg-gray-500 text-white px-4 py-2 rounded"
          >
            キャンセル
          </button>
        )}
      </form>

      <ul className="space-y-2">
        {accounts.map((account) => (
          <li
            key={account.id}
            className="flex justify-between items-center p-2 border rounded"
          >
            <div>
              <span className="font-semibold">{account.name}</span> ({account.category}) - {account.balance}円
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(account)}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                編集
              </button>
              <button
                onClick={() => handleDeleteClick(account.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>

      {confirmingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <p className="mb-4">本当にこの口座を削除しますか？</p>
            <div className="flex space-x-4">
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                はい
              </button>
              <button
                onClick={handleCancelDelete}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}