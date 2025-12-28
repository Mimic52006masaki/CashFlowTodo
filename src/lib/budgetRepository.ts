import { db, auth, appId } from './firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { Budget } from './types';

export class BudgetRepository {
  static async getBudgets(): Promise<Budget[]> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const budgetsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'budgets');
    const q = query(budgetsCollection, orderBy('amount', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Budget));
  }

  static async createBudget(budget: Omit<Budget, 'id'>): Promise<string> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const budgetsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'budgets');
    const docRef = await addDoc(budgetsCollection, {
      ...budget,
      userId: auth.currentUser.uid,
    });
    return docRef.id;
  }

  static async updateBudget(id: string, budget: Partial<Budget>): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const budgetsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'budgets');
    const docRef = doc(budgetsCollection, id);
    await updateDoc(docRef, budget);
  }

  static async deleteBudget(id: string): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const budgetsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'budgets');
    const docRef = doc(budgetsCollection, id);
    await deleteDoc(docRef);
  }
}