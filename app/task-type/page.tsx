'use client'

import { useRouter } from 'next/navigation'

export default function TaskType() {
  const router = useRouter()

  const selectType = (type: string) => {
    router.push(`/task-create?type=${type}`)
  }

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">タスク種別選択</h1>
      <div className="space-y-4">
        <button
          onClick={() => selectType('withdraw')}
          className="w-full bg-blue-500 text-white p-4 rounded"
        >
          出金 (Withdraw)
        </button>
        <button
          onClick={() => selectType('transfer')}
          className="w-full bg-green-500 text-white p-4 rounded"
        >
          振替 (Transfer)
        </button>
        <button
          onClick={() => selectType('deposit')}
          className="w-full bg-yellow-500 text-white p-4 rounded"
        >
          入金 (Deposit)
        </button>
        <button
          onClick={() => selectType('charge')}
          className="w-full bg-purple-500 text-white p-4 rounded"
        >
          チャージ (Charge)
        </button>
      </div>
    </main>
  )
}