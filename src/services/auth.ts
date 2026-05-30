import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { app } from './firebase';
import {
  setToken,
  clearToken,
  getToken,
  setStoredUser,
  clearStoredUser,
} from './api';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const exchangeFirebaseToken = async (firebaseUser: User): Promise<void> => {
  const idToken = await firebaseUser.getIdToken();
  const response = await fetch('https://forja-api.onrender.com/cuentas/auth/firebase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al autenticar con el servidor');
  }
  const json = await response.json();
  const payload = json.data ?? json;
  if (!payload?.token) throw new Error('Respuesta inesperada del servidor de autenticación');
  setToken(payload.token);
  setStoredUser(payload.user);
};

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  await exchangeFirebaseToken(result.user);
  return result.user;
};

export const signOut = async () => {
  await firebaseSignOut(auth);
  clearToken();
  clearStoredUser();
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user && !getToken()) {
      try {
        await exchangeFirebaseToken(user);
      } catch (e) {
        console.error('Error al renovar token del backend:', e);
      }
    }
    callback(user);
  });
};

export { auth };
