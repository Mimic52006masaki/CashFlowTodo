import { db, auth, appId } from './firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { Account } from './types';

export class AccountRepository {
  static async getAccounts(): Promise<Account[]> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const accountsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'accounts');
    const q = query(accountsCollection, orderBy('order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Account));
  }

  static async createAccount(account: Omit<Account, 'id'>): Promise<string> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const accountsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'accounts');
    const docRef = await addDoc(accountsCollection, {
      ...account,
      userId: auth.currentUser.uid,
    });
    return docRef.id;
  }

  static async updateAccount(id: string, account: Partial<Account>): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const accountsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'accounts');
    const docRef = doc(accountsCollection, id);
    await updateDoc(docRef, account);
  }

  static async deleteAccount(id: string): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const accountsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'accounts');
    const docRef = doc(accountsCollection, id);
    await deleteDoc(docRef);
  }
}