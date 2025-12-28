import { db } from './firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  runTransaction,
} from 'firebase/firestore'
import { Account, BudgetTask, MonthlySession, TaskTemplate, AppUser } from './types'

// Accounts CRUD
export const getAccounts = async (userId: string): Promise<Account[]> => {
  const q = query(
    collection(db, 'users', userId, 'accounts'),
    orderBy('createdAt')
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      }) as Account
  )
}

export const addAccount = async (
  userId: string,
  account: Omit<Account, 'id' | 'createdAt'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'users', userId, 'accounts'), {
    ...account,
    createdAt: new Date(),
  })
  return docRef.id
}

export const updateAccount = async (
  userId: string,
  accountId: string,
  updates: Partial<Account>
) => {
  const docRef = doc(db, 'users', userId, 'accounts', accountId)
  await updateDoc(docRef, updates)
}

export const deleteAccount = async (userId: string, accountId: string) => {
  const docRef = doc(db, 'users', userId, 'accounts', accountId)
  await deleteDoc(docRef)
}

// BudgetTasks CRUD
export const getBudgetTasks = async (
  userId: string,
  sessionId: string
): Promise<BudgetTask[]> => {
  const q = query(
    collection(db, 'users', userId, 'budgetTasks'),
    orderBy('createdAt')
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs
    .map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        }) as BudgetTask
    )
    .filter((task) => task.sessionId === sessionId)
}

export const addBudgetTask = async (
  userId: string,
  task: Omit<BudgetTask, 'id' | 'createdAt'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'users', userId, 'budgetTasks'), {
    ...task,
    createdAt: new Date(),
  })
  return docRef.id
}

export const updateBudgetTask = async (
  userId: string,
  taskId: string,
  updates: Partial<BudgetTask>
) => {
  const docRef = doc(db, 'users', userId, 'budgetTasks', taskId)
  await updateDoc(docRef, updates)
}

export const deleteBudgetTask = async (userId: string, taskId: string) => {
  const docRef = doc(db, 'users', userId, 'budgetTasks', taskId)
  await deleteDoc(docRef)
}

// MonthlySessions CRUD
export const getMonthlySessions = async (
  userId: string
): Promise<MonthlySession[]> => {
  const q = query(
    collection(db, 'users', userId, 'monthlySessions'),
    orderBy('createdAt', 'desc')
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
        salaryDate: doc.data().salaryDate.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      }) as MonthlySession
  )
}

export const addMonthlySession = async (
  userId: string,
  session: Omit<MonthlySession, 'id' | 'createdAt'>
): Promise<string> => {
  const docRef = await addDoc(
    collection(db, 'users', userId, 'monthlySessions'),
    {
      ...session,
      createdAt: new Date(),
    }
  )
  return docRef.id
}

export const updateMonthlySession = async (
  userId: string,
  sessionId: string,
  updates: Partial<MonthlySession>
) => {
  const docRef = doc(db, 'users', userId, 'monthlySessions', sessionId)
  await updateDoc(docRef, updates)
}

export const deleteMonthlySession = async (
  userId: string,
  sessionId: string
) => {
  const docRef = doc(db, 'users', userId, 'monthlySessions', sessionId)
  await deleteDoc(docRef)
}

// Complete task with balance update
export const completeTask = async (userId: string, taskId: string) => {
  await runTransaction(db, async (transaction) => {
    const taskRef = doc(db, 'users', userId, 'budgetTasks', taskId)
    const taskSnap = await transaction.get(taskRef)

    if (!taskSnap.exists()) throw new Error('Task not found')

    const task = { id: taskSnap.id, ...taskSnap.data() } as BudgetTask

    if (task.isCompleted) return // Already completed

    // Update balances based on task type
    if (task.fromAccountId) {
      const fromRef = doc(db, 'users', userId, 'accounts', task.fromAccountId)
      const fromSnap = await transaction.get(fromRef)
      const fromBalance = fromSnap.data()?.balance || 0
      transaction.update(fromRef, { balance: fromBalance - task.amount })
    }

    if (task.toAccountId) {
      const toRef = doc(db, 'users', userId, 'accounts', task.toAccountId)
      const toSnap = await transaction.get(toRef)
      const toBalance = toSnap.data()?.balance || 0
      transaction.update(toRef, { balance: toBalance + task.amount })
    }

    transaction.update(taskRef, { isCompleted: true })
  })
}

// TaskTemplates CRUD
export const getTaskTemplates = async (userId: string): Promise<TaskTemplate[]> => {
  const q = query(
    collection(db, 'users', userId, 'taskTemplates'),
    orderBy('createdAt')
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      }) as TaskTemplate
  )
}

export const addTaskTemplate = async (
  userId: string,
  template: Omit<TaskTemplate, 'id' | 'createdAt'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'users', userId, 'taskTemplates'), {
    ...template,
    createdAt: new Date(),
  })
  return docRef.id
}

export const updateTaskTemplate = async (
  userId: string,
  templateId: string,
  updates: Partial<TaskTemplate>
) => {
  const docRef = doc(db, 'users', userId, 'taskTemplates', templateId)
  await updateDoc(docRef, updates)
}

export const deleteTaskTemplate = async (userId: string, templateId: string) => {
  const docRef = doc(db, 'users', userId, 'taskTemplates', templateId)
  await deleteDoc(docRef)
}

// AppUser CRUD
export const getAppUser = async (userId: string): Promise<AppUser | null> => {
  const docRef = doc(db, 'users', userId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt.toDate(),
    } as AppUser
  }
  return null
}

export const addAppUser = async (userId: string) => {
  const docRef = doc(db, 'users', userId)
  await setDoc(docRef, {
    createdAt: new Date(),
  })
}

export const updateAppUser = async (userId: string, updates: Partial<AppUser>) => {
  const docRef = doc(db, 'users', userId)
  await updateDoc(docRef, updates)
}
