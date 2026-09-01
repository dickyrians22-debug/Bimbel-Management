import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance
let app: FirebaseApp;
let db: Firestore;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Use custom databaseId if configured, or default
  const databaseId =
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== ''
      ? firebaseConfig.firestoreDatabaseId.trim()
      : '(default)';

  try {
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, databaseId);
  } catch {
    db = getFirestore(app, databaseId);
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export { app, db };

// Collection constants
export const COLLECTIONS = {
  STUDENTS: 'students',
  ATTENDANCE: 'attendance',
  INCOMES: 'incomes',
  EXPENSES: 'expenses',
  USERS: 'users',
  SETTINGS: 'settings',
  PROSPECTIVE_STUDENTS: 'prospective_students',
} as const;

export type CollectionKey = keyof typeof COLLECTIONS;

/**
 * Realtime subscription listener for any Firestore collection
 */
export function subscribeToCollection<T>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!db) {
    console.warn('Firestore db not initialized, subscription skipped');
    return () => {};
  }

  try {
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as unknown as T);
        });
        onUpdate(items);
      },
      (error) => {
        console.error(`Error subscribing to collection ${collectionName}:`, error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.error(`Exception setting up listener for ${collectionName}:`, err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save / Update a single document in Firestore
 */
export async function syncDocToFirestore<T extends { id: string }>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, collectionName, docId);
    // Sanitize undefined fields which Firestore rejects
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.error(`Error syncing doc ${docId} to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete a document in Firestore
 */
export async function deleteDocFromFirestore(
  collectionName: string,
  docId: string
): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting doc ${docId} from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Batch upload / seed initial data to Firestore
 */
export async function batchSeedToFirestore(
  collectionName: string,
  items: Array<{ id: string } & Record<string, any>>
): Promise<void> {
  if (!db || !items || items.length === 0) return;
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      const cleanData = JSON.parse(JSON.stringify(item));
      batch.set(docRef, cleanData, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error(`Error batch seeding to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Replace all documents in a Firestore collection with a new set of items
 */
export async function replaceAllInCollection(
  collectionName: string,
  newItems: Array<{ id: string } & Record<string, any>>
): Promise<void> {
  if (!db) return;
  try {
    const colRef = collection(db, collectionName);
    const existingSnap = await getDocs(colRef);
    
    // Batch delete existing
    const deleteBatch = writeBatch(db);
    existingSnap.forEach((docSnap) => {
      deleteBatch.delete(docSnap.ref);
    });
    await deleteBatch.commit();

    // Batch insert new items
    if (newItems.length > 0) {
      const insertBatch = writeBatch(db);
      newItems.forEach((item) => {
        const docRef = doc(db, collectionName, item.id);
        const cleanData = JSON.parse(JSON.stringify(item));
        insertBatch.set(docRef, cleanData);
      });
      await insertBatch.commit();
    }
  } catch (error) {
    console.error(`Error replacing collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Clear all documents in a Firestore collection
 */
export async function clearFirestoreCollection(collectionName: string): Promise<void> {
  if (!db) return;
  try {
    const colRef = collection(db, collectionName);
    const existingSnap = await getDocs(colRef);
    if (existingSnap.empty) return;
    
    const deleteBatch = writeBatch(db);
    existingSnap.forEach((docSnap) => {
      deleteBatch.delete(docSnap.ref);
    });
    await deleteBatch.commit();
  } catch (error) {
    console.error(`Error clearing collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Check if collection has documents in Firestore
 */
export async function checkCollectionCount(collectionName: string): Promise<number> {
  if (!db) return 0;
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.size;
  } catch (error) {
    console.error(`Error checking count for ${collectionName}:`, error);
    return 0;
  }
}
