import {
  db,
  auth,
  collection,
  doc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  serverTimestamp,
} from '../lib/firebase';
import { User, isHardcodedAdminEmail } from '../types';

export type BalanceUpdateMode = 'SET' | 'GRANT' | 'DEDUCT';

export interface FirestoreBalanceUpdateParams {
  targetUser: User;
  mode: BalanceUpdateMode;
  amount: number; // For 'SET', this is the exact new balance. For 'GRANT'/'DEDUCT', this is the delta.
  reason: string;
  adminUser: User | null;
}

export interface FirestoreBalanceUpdateResult {
  success: boolean;
  newBalance: number;
  previousBalance: number;
  docPath: string;
  message: string;
  syncedToFirestore: boolean;
}

/**
 * Resolves the canonical Firestore document ID in the `users` collection for a given user.
 * Prefers `authUid` if linked to a Firebase Auth account, otherwise uses `user.id`.
 */
export function resolveUserFirestoreDocId(user: User): string {
  return user.authUid || user.id;
}

/**
 * Verifies whether the current operator is an authenticated administrator
 * authorized to write to the `balance` field in the `users` collection.
 */
export function verifyAdminBalanceWriteAuthority(adminUser: User | null): {
  authorized: boolean;
  reason?: string;
} {
  const firebaseAuthUser = auth.currentUser;
  const emailToCheck = firebaseAuthUser?.email || adminUser?.email || '';

  const hasAdminRole =
    adminUser?.role === 'admin' ||
    isHardcodedAdminEmail(emailToCheck) ||
    isHardcodedAdminEmail(adminUser?.email);

  if (!hasAdminRole) {
    return {
      authorized: false,
      reason:
        'Permission Denied: Only authenticated administrators can modify the balance field in the users collection.',
    };
  }

  return { authorized: true };
}

/**
 * Manually updates a user's `balance` field in the Firestore `users` collection.
 * Enforces admin-only write checks on the client and pairs with Firebase Security Rules
 * that restrict `balance` field writes exclusively to authenticated admins.
 */
export async function updateFirestoreUserBalance(
  params: FirestoreBalanceUpdateParams
): Promise<FirestoreBalanceUpdateResult> {
  const { targetUser, mode, amount, reason, adminUser } = params;
  const previousBalance = Number(targetUser.balance) || 0;
  const docId = resolveUserFirestoreDocId(targetUser);
  const docPath = `users/${docId}`;

  // 1. Verify Admin Authority
  const authCheck = verifyAdminBalanceWriteAuthority(adminUser);
  if (!authCheck.authorized) {
    return {
      success: false,
      newBalance: previousBalance,
      previousBalance,
      docPath,
      message: authCheck.reason || 'Unauthorized balance update attempt.',
      syncedToFirestore: false,
    };
  }

  // 2. Validate numeric input
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    return {
      success: false,
      newBalance: previousBalance,
      previousBalance,
      docPath,
      message: 'Invalid balance amount. Balance must be a non-negative number.',
      syncedToFirestore: false,
    };
  }

  // 3. Calculate resulting balance
  let newBalance = previousBalance;
  if (mode === 'SET') {
    newBalance = Math.max(0, Number(amount.toFixed(2)));
  } else if (mode === 'GRANT') {
    newBalance = Math.max(0, Number((previousBalance + amount).toFixed(2)));
  } else if (mode === 'DEDUCT') {
    newBalance = Math.max(0, Number((previousBalance - amount).toFixed(2)));
  }

  const sanitizedReason =
    reason.trim() ||
    (mode === 'SET'
      ? `Manual balance override to ₹${newBalance.toLocaleString('en-IN')} by Admin`
      : mode === 'GRANT'
      ? `Manual credit grant of +₹${amount.toLocaleString('en-IN')} by Admin`
      : `Manual credit deduction of -₹${amount.toLocaleString('en-IN')} by Admin`);

  const adminIdentifier =
    auth.currentUser?.uid || adminUser?.id || 'ADM-JATIN-01';
  const adminEmail =
    auth.currentUser?.email || adminUser?.email || 'jatinrathodeklo@gmail.com';

  // 4. Write directly to Firestore `users/{docId}`
  let syncedToFirestore = false;
  try {
    const userDocRef = doc(db, 'users', docId);

    if (mode === 'GRANT' && targetUser.isRealAuthUser) {
      try {
        await updateDoc(userDocRef, {
          balance: increment(amount),
          balanceUpdatedAt: serverTimestamp(),
          balanceUpdatedBy: adminIdentifier,
          balanceUpdatedByEmail: adminEmail,
          balanceUpdateReason: sanitizedReason,
        });
        syncedToFirestore = true;
      } catch {
        // Fallback if document doesn't exist yet
        await setDoc(
          userDocRef,
          {
            uid: docId,
            id: targetUser.id,
            gameAccountId: targetUser.gameAccountId,
            username: targetUser.username,
            displayName: targetUser.username,
            email: targetUser.email,
            role: targetUser.role,
            balance: newBalance,
            accountStatus: targetUser.accountStatus || 'ACTIVE',
            riskLevel: targetUser.riskLevel || 'LOW',
            violationCount: targetUser.violationCount || 0,
            avatar: targetUser.avatar,
            vipTier: targetUser.vipTier || 'Gold',
            balanceUpdatedAt: serverTimestamp(),
            balanceUpdatedBy: adminIdentifier,
            balanceUpdatedByEmail: adminEmail,
            balanceUpdateReason: sanitizedReason,
          },
          { merge: true }
        );
        syncedToFirestore = true;
      }
    } else if (mode === 'DEDUCT' && targetUser.isRealAuthUser && previousBalance >= amount) {
      try {
        await updateDoc(userDocRef, {
          balance: increment(-amount),
          balanceUpdatedAt: serverTimestamp(),
          balanceUpdatedBy: adminIdentifier,
          balanceUpdatedByEmail: adminEmail,
          balanceUpdateReason: sanitizedReason,
        });
        syncedToFirestore = true;
      } catch {
        await setDoc(
          userDocRef,
          {
            uid: docId,
            id: targetUser.id,
            gameAccountId: targetUser.gameAccountId,
            username: targetUser.username,
            displayName: targetUser.username,
            email: targetUser.email,
            role: targetUser.role,
            balance: newBalance,
            accountStatus: targetUser.accountStatus || 'ACTIVE',
            balanceUpdatedAt: serverTimestamp(),
            balanceUpdatedBy: adminIdentifier,
            balanceUpdatedByEmail: adminEmail,
            balanceUpdateReason: sanitizedReason,
          },
          { merge: true }
        );
        syncedToFirestore = true;
      }
    } else {
      // Mode === 'SET' or document upsert
      try {
        await updateDoc(userDocRef, {
          balance: newBalance,
          balanceUpdatedAt: serverTimestamp(),
          balanceUpdatedBy: adminIdentifier,
          balanceUpdatedByEmail: adminEmail,
          balanceUpdateReason: sanitizedReason,
        });
        syncedToFirestore = true;
      } catch {
        await setDoc(
          userDocRef,
          {
            uid: docId,
            id: targetUser.id,
            gameAccountId: targetUser.gameAccountId,
            username: targetUser.username,
            displayName: targetUser.username,
            email: targetUser.email,
            role: targetUser.role,
            balance: newBalance,
            accountStatus: targetUser.accountStatus || 'ACTIVE',
            riskLevel: targetUser.riskLevel || 'LOW',
            violationCount: targetUser.violationCount || 0,
            avatar: targetUser.avatar,
            vipTier: targetUser.vipTier || 'Gold',
            balanceUpdatedAt: serverTimestamp(),
            balanceUpdatedBy: adminIdentifier,
            balanceUpdatedByEmail: adminEmail,
            balanceUpdateReason: sanitizedReason,
          },
          { merge: true }
        );
        syncedToFirestore = true;
      }
    }

    // Also write an immutable audit record to `balance_audit_logs`
    const auditId = `BAL-AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await setDoc(doc(db, 'balance_audit_logs', auditId), {
      id: auditId,
      targetDocId: docId,
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
      targetEmail: targetUser.email,
      mode,
      previousBalance,
      newBalance,
      delta: newBalance - previousBalance,
      reason: sanitizedReason,
      adminId: adminIdentifier,
      adminEmail,
      createdAt: serverTimestamp(),
    }).catch(() => {});
  } catch (err) {
    console.warn('Firestore balance update notice (local state updated):', err);
  }

  return {
    success: true,
    newBalance,
    previousBalance,
    docPath,
    syncedToFirestore,
    message: syncedToFirestore
      ? `Firestore [${docPath}.balance] updated from ₹${previousBalance.toLocaleString('en-IN')} to ₹${newBalance.toLocaleString('en-IN')}.`
      : `Balance updated to ₹${newBalance.toLocaleString('en-IN')} (local state synced; sign in with Firebase Admin to persist to cloud Firestore).`,
  };
}

/**
 * Converts a raw Firestore document from `collection(db, 'users')` into a normalized `User` object.
 */
export function mapFirestoreDocToUser(docId: string, data: Record<string, any>): User {
  const email = String(data.email || '').trim().toLowerCase();
  const isAdmin =
    data.role === 'admin' || isHardcodedAdminEmail(email);

  const rawSerial = docId.replace(/[^0-9]/g, '').slice(0, 6) || '849201';
  const resolvedId = data.id || (isAdmin ? 'ADM-JATIN-01' : `BIT-${docId.slice(0, 6).toUpperCase()}`);
  const resolvedGameId =
    data.gameAccountId || `BTY-GAME-${docId.slice(0, 6).toUpperCase() || rawSerial}`;

  return {
    id: resolvedId,
    authUid: data.uid || docId,
    isRealAuthUser: true,
    gameAccountId: resolvedGameId,
    username:
      data.username ||
      data.displayName ||
      (email ? email.split('@')[0] : `Player_${docId.slice(0, 5)}`),
    email: email || `${docId.slice(0, 8)}@bityora.user`,
    phone: data.phone || data.phoneNumber || '+91 98000 00000',
    role: isAdmin ? 'admin' : 'player',
    balance: typeof data.balance === 'number' && !isNaN(data.balance) ? Math.max(0, data.balance) : 100,
    accountStatus: data.accountStatus || data.status || 'ACTIVE',
    statusReason: data.statusReason,
    statusUpdatedAt: data.statusUpdatedAt,
    riskLevel: data.riskLevel || 'LOW',
    violationCount: typeof data.violationCount === 'number' ? data.violationCount : 0,
    illicitActivityFlags: Array.isArray(data.illicitActivityFlags) ? data.illicitActivityFlags : [],
    currentGame: data.currentGame,
    gameSessionStatus: data.gameSessionStatus || 'ONLINE',
    lastActivity: data.lastActivity || 'Synced via Firebase Auth',
    isSuspended: Boolean(data.isSuspended || (data.accountStatus && data.accountStatus !== 'ACTIVE')),
    vipTier: data.vipTier || (isAdmin ? 'Diamond VIP' : 'Gold'),
    avatar:
      data.photoURL ||
      data.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    createdAt:
      typeof data.createdAt === 'string'
        ? data.createdAt
        : new Date().toISOString().split('T')[0],
    totalWagered: typeof data.totalWagered === 'number' ? data.totalWagered : 0,
    totalWon: typeof data.totalWon === 'number' ? data.totalWon : 0,
  };
}

/**
 * Subscribes in real-time to the `users` collection in Firestore so both the
 * main game client and the Admin Suite stay synchronized with live user profiles and balances.
 */
export function subscribeToUsersCollection(
  onUpdate: (firestoreUsers: User[]) => void,
  onStatusChange?: (isLive: boolean) => void
): () => void {
  try {
    const usersColRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersColRef,
      snapshot => {
        const syncedUsers: User[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data) {
            syncedUsers.push(mapFirestoreDocToUser(docSnap.id, data));
          }
        });
        if (onStatusChange) onStatusChange(true);
        onUpdate(syncedUsers);
      },
      err => {
        console.warn('Firestore users collection listener notice:', err.message);
        if (onStatusChange) onStatusChange(false);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to initialize Firestore users listener:', err);
    if (onStatusChange) onStatusChange(false);
    return () => {};
  }
}
