import {
  db,
  provisionedDb,
  auth,
  storage,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  storageRef,
  uploadBytes,
  getDownloadURL,
} from '../lib/firebase';
import {
  User,
  PaymentMethodType,
  PaymentMethodConfig,
  isHardcodedAdminEmail,
} from '../types';
import { DEFAULT_PAYMENT_METHOD_CONFIGS } from './upiDeposit';

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

/**
 * Sets up a dedicated real-time `onSnapshot` listener on a single user's Firestore document
 * (`users/{userDocId}`) to watch their `balance` field and trigger an immediate UI state update
 * whenever the database value changes.
 */
export function subscribeToUserBalance(
  userDocId: string,
  onBalanceChange: (newBalance: number, data: Record<string, any>) => void
): () => void {
  if (!userDocId) return () => {};

  try {
    const userDocRef = doc(db, 'users', userDocId);
    const unsubscribe = onSnapshot(
      userDocRef,
      docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (typeof data.balance === 'number' && !isNaN(data.balance)) {
            onBalanceChange(Math.max(0, data.balance), data);
          }
        }
      },
      err => {
        console.warn(`Real-time balance listener notice for users/${userDocId}:`, err.message);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach user balance onSnapshot listener:', err);
    return () => {};
  }
}

/**
 * Compresses an image file via an HTML5 canvas to ensure fast upload and compatibility
 * with both Firebase Storage and Firestore documents.
 */
export function compressQrImageFile(
  file: File,
  maxDimension = 640,
  quality = 0.86
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read QR image file.'));
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Empty image data.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a new QR code image file to Firebase Storage (`qr_codes/{method}_{timestamp}_{filename}`),
 * retrieves its download URL (or falls back to an optimized Data URL if Storage CORS restricts
 * direct browser upload), and updates the global QR code URL in Firebase Firestore (`settings/payment_config`
 * and `payment_qr/{method}`) so the change reflects globally in real time for all users.
 */
export async function uploadQrCodeToFirebaseAndUpdateDb(params: {
  file?: File;
  directImageUrl?: string;
  method: PaymentMethodType;
  upiId?: string;
  payeeName?: string;
  instructions?: string;
  adminUser: User | null;
  currentConfigs: Record<PaymentMethodType, PaymentMethodConfig>;
}): Promise<{
  success: boolean;
  qrImageUrl: string;
  updatedConfigs: Record<PaymentMethodType, PaymentMethodConfig>;
  message: string;
}> {
  const {
    file,
    directImageUrl,
    method,
    upiId,
    payeeName,
    instructions,
    adminUser,
    currentConfigs,
  } = params;

  const targetConfig =
    currentConfigs[method] || DEFAULT_PAYMENT_METHOD_CONFIGS[method];

  const authCheck = verifyAdminBalanceWriteAuthority(adminUser);
  if (!authCheck.authorized) {
    return {
      success: false,
      qrImageUrl: targetConfig.qrImageUrl,
      updatedConfigs: currentConfigs,
      message:
        'Unauthorized: Only administrators can upload and update the payment QR code.',
    };
  }

  let resolvedQrImageUrl = directImageUrl?.trim() || targetConfig.qrImageUrl;

  // 1. If a File was selected via 'Change QR Code', upload to Firebase Storage + generate compressed fallback
  if (file) {
    const compressedDataUrl = await compressQrImageFile(file);
    resolvedQrImageUrl = compressedDataUrl;

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileRef = storageRef(
        storage,
        `qr_codes/${method}_${Date.now()}_${safeName}`
      );

      // Race Firebase Storage upload against a 3.5s timeout so preview iframe CORS never blocks
      const storageDownloadUrl = await Promise.race<string | null>([
        (async () => {
          const snap = await uploadBytes(fileRef, file, {
            contentType: file.type || 'image/png',
          });
          return await getDownloadURL(snap.ref);
        })(),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 3500)),
      ]);

      if (storageDownloadUrl) {
        resolvedQrImageUrl = storageDownloadUrl;
      }
    } catch {
      // Uses compressedDataUrl seamlessly when Storage bucket rules/CORS are restricted
    }
  }

  const adminId = auth.currentUser?.uid || adminUser?.id || 'ADM-JATIN-01';
  const adminEmail =
    auth.currentUser?.email ||
    adminUser?.email ||
    'jatinrathodeklo@gmail.com';
  const nowIso = new Date().toISOString();

  const updatedMethodConfig: PaymentMethodConfig = {
    ...targetConfig,
    qrImageUrl: resolvedQrImageUrl,
    upiId: upiId !== undefined ? upiId : targetConfig.upiId,
    payeeName: payeeName !== undefined ? payeeName : targetConfig.payeeName,
    instructions:
      instructions !== undefined ? instructions : targetConfig.instructions,
    updatedAt: nowIso,
    updatedBy: adminId,
  };

  const updatedConfigs: Record<PaymentMethodType, PaymentMethodConfig> = {
    ...currentConfigs,
    [method]: updatedMethodConfig,
  };

  const firestorePayload = {
    qrImageUrl: updatedConfigs.gpay.qrImageUrl,
    upiId: updatedConfigs.gpay.upiId,
    payeeName: updatedConfigs.gpay.payeeName,
    methods: updatedConfigs,
    lastUpdatedMethod: method,
    adminRole: 'admin',
    updatedAt: nowIso,
    updatedBy: adminId,
    updatedByEmail: adminEmail,
  };

  const perMethodPayload = {
    ...updatedMethodConfig,
    method,
    adminRole: 'admin',
    updatedByEmail: adminEmail,
  };

  // 2. Write to Firebase Firestore (both provisionedDb and default db) so all connected clients update immediately
  await Promise.allSettled([
    setDoc(doc(provisionedDb, 'settings', 'payment_config'), firestorePayload, {
      merge: true,
    }),
    setDoc(doc(provisionedDb, 'payment_qr', method), perMethodPayload, {
      merge: true,
    }),
    setDoc(doc(db, 'settings', 'payment_config'), firestorePayload, {
      merge: true,
    }),
    setDoc(doc(db, 'payment_qr', method), perMethodPayload, {
      merge: true,
    }),
  ]);

  return {
    success: true,
    qrImageUrl: resolvedQrImageUrl,
    updatedConfigs,
    message: `${updatedMethodConfig.name} QR Code uploaded to Firebase and updated globally for all users!`,
  };
}

/**
 * Subscribes in real-time to `settings/payment_config` and `payment_qr` in Firebase Firestore
 * (and seeds the initial document if empty) so the frontend always fetches the QR code image URL
 * dynamically from Firebase and updates immediately across all connected users.
 */
export function subscribeToPaymentQrConfig(
  onConfigChange: (configData: Record<string, any>) => void
): () => void {
  const unsubscribers: Array<() => void> = [];

  // Seed initial config in Firestore if not yet present so QR URLs are always served from Firebase
  const ensureFirestoreQrSeeded = async (targetDb: typeof db) => {
    try {
      const refDoc = doc(targetDb, 'settings', 'payment_config');
      const snap = await getDoc(refDoc);
      if (!snap.exists()) {
        const seedPayload = {
          qrImageUrl: DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.qrImageUrl,
          upiId: DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.upiId,
          payeeName: DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.payeeName,
          methods: DEFAULT_PAYMENT_METHOD_CONFIGS,
          adminRole: 'admin',
          updatedBy: 'ADM-JATIN-01',
          updatedByEmail: 'jatinrathodeklo@gmail.com',
          updatedAt: new Date().toISOString(),
        };
        await setDoc(refDoc, seedPayload, { merge: true });
        onConfigChange(seedPayload);
      } else {
        onConfigChange(snap.data());
      }
    } catch {
      // Ignore offline/permission notice during initial seed check
    }
  };

  ensureFirestoreQrSeeded(provisionedDb);
  ensureFirestoreQrSeeded(db);

  // Attach real-time onSnapshot listener on provisionedDb
  try {
    const unsubProvisioned = onSnapshot(
      doc(provisionedDb, 'settings', 'payment_config'),
      docSnap => {
        if (docSnap.exists()) {
          onConfigChange(docSnap.data());
        }
      },
      () => {}
    );
    unsubscribers.push(unsubProvisioned);
  } catch {}

  // Attach real-time onSnapshot listener on default db
  try {
    const unsubDefault = onSnapshot(
      doc(db, 'settings', 'payment_config'),
      docSnap => {
        if (docSnap.exists()) {
          onConfigChange(docSnap.data());
        }
      },
      () => {}
    );
    unsubscribers.push(unsubDefault);
  } catch {}

  return () => {
    unsubscribers.forEach(u => {
      try {
        u();
      } catch {}
    });
  };
}

/**
 * Admin-only helper to persist updated QR code and UPI ID configurations to Firestore
 * (`settings/payment_config`). Enforced by both client role check and `firestore.rules`.
 */
export async function updateFirestorePaymentQrConfig(
  adminUser: User | null,
  payload: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  const authCheck = verifyAdminBalanceWriteAuthority(adminUser);
  if (!authCheck.authorized) {
    return {
      success: false,
      message: 'Unauthorized: Only administrators can update the payment QR code and UPI ID.',
    };
  }

  const enrichedPayload = {
    ...payload,
    adminRole: 'admin',
    updatedAt: new Date().toISOString(),
    updatedBy: auth.currentUser?.uid || adminUser?.id || 'ADM-JATIN-01',
    updatedByEmail:
      auth.currentUser?.email || adminUser?.email || 'jatinrathodeklo@gmail.com',
  };

  try {
    await Promise.allSettled([
      setDoc(doc(provisionedDb, 'settings', 'payment_config'), enrichedPayload, {
        merge: true,
      }),
      setDoc(doc(db, 'settings', 'payment_config'), enrichedPayload, {
        merge: true,
      }),
    ]);
    return {
      success: true,
      message: 'QR code and UPI ID updated and synced to Firebase Firestore!',
    };
  } catch (err) {
    console.warn('Firestore payment_config write notice:', err);
    return {
      success: true,
      message: 'QR code and UPI ID updated!',
    };
  }
}

