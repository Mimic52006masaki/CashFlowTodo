import { db, auth, appId } from './firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, orderBy, query, FieldValue } from 'firebase/firestore';
import { Account } from './types';

export class AccountRepository {
  static async getAccounts(): Promise<Account[]> {
    console.log('AccountRepository.getAccounts called');
    if (!auth.currentUser) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    console.log('User authenticated:', auth.currentUser.uid);

    const accountsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'accounts');
    const q = query(accountsCollection, orderBy('order'));
    console.log('Querying accounts:', accountsCollection.path);
    const snapshot = await getDocs(q);
    console.log('Fetched', snapshot.docs.length, 'accounts');
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Account));
  }

  static async createAccount(account: Omit<Account, 'id'>): Promise<string> {
    console.log('AccountRepository.createAccount called with', account);
    if (!auth.currentUser) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    const accountsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'accounts');
    console.log('Adding account to collection:', accountsCollection.path);
    const docRef = await addDoc(accountsCollection, {
      ...account,
      userId: auth.currentUser.uid,
    });
    console.log('Created account with ID:', docRef.id);
    return docRef.id;
  }

  static async updateAccount(id: string, account: Record<string, any>): Promise<void> {
    console.log('AccountRepository.updateAccount called with ID:', id, 'data:', account);
    if (!auth.currentUser) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    const accountsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'accounts');
    const docRef = doc(accountsCollection, id);
    console.log('Updating doc at:', docRef.path);
    await updateDoc(docRef, account);
    console.log('Updated account successfully');
  }

  static async deleteAccount(id: string): Promise<void> {
    console.log('AccountRepository.deleteAccount called with ID:', id);
    if (!auth.currentUser) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    const accountsCollection = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'accounts');
    const docRef = doc(accountsCollection, id);
    console.log('Deleting doc at:', docRef.path);
    await deleteDoc(docRef);
    console.log('Deleted account successfully');
  }
}