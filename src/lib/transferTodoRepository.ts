import { db, auth, appId } from './firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, orderBy, query, writeBatch } from 'firebase/firestore';
import { TransferTodo } from './types';

export class TransferTodoRepository {
  static async getTransferTodos(): Promise<TransferTodo[]> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const transferTodosCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transferTodos');
    const q = query(transferTodosCollection, orderBy('order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TransferTodo));
  }

  static async createTransferTodo(transferTodo: Omit<TransferTodo, 'id'>): Promise<string> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const transferTodosCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transferTodos');
    const docRef = await addDoc(transferTodosCollection, {
      ...transferTodo,
      userId: auth.currentUser.uid,
    });
    return docRef.id;
  }

  static async updateTransferTodo(id: string, transferTodo: Partial<TransferTodo>): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const transferTodosCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transferTodos');
    const docRef = doc(transferTodosCollection, id);
    await updateDoc(docRef, transferTodo);
  }

  static async deleteTransferTodo(id: string): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const transferTodosCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transferTodos');
    const docRef = doc(transferTodosCollection, id);
    await deleteDoc(docRef);
  }

  static async updateOrder(todos: { id: string; order: number }[]): Promise<void> {
    const batch = writeBatch(db);
    todos.forEach(({ id, order }) => {
      if (!auth.currentUser) return;
      const transferTodosCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transferTodos');
      const docRef = doc(transferTodosCollection, id);
      batch.update(docRef, { order });
    });
    await batch.commit();
  }
}