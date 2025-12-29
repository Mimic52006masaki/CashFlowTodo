import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, appId } from './firebase';
import { Settings } from './types';

export class BudgetRepository {
  private static readonly COLLECTION = 'settings';
  private static readonly DOC_ID = 'global';

  static async getSettings(): Promise<Settings> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const docRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, this.COLLECTION, this.DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Settings;
    }
    return { autoResetEnabled: false };
  }

  static async updateSettings(settings: Partial<Settings>): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const docRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, this.COLLECTION, this.DOC_ID);
    await setDoc(docRef, settings, { merge: true });
  }
}