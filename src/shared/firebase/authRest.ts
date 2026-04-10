import { firebaseConfig } from './firebase';

type AuthResponse = {
  localId: string;
  email: string;
  idToken: string;
  refreshToken: string;
  displayName?: string;
};

type LookupResponse = {
  users?: Array<{
    displayName?: string;
    email?: string;
    localId?: string;
  }>;
};

type FirebaseErrorPayload = {
  error?: {
    message?: string;
  };
};

const AUTH_BASE_URL = 'https://identitytoolkit.googleapis.com/v1';

function mapAuthError(message?: string) {
  switch (message) {
    case 'EMAIL_EXISTS':
      return 'This email is already registered.';
    case 'WEAK_PASSWORD : Password should be at least 6 characters':
    case 'WEAK_PASSWORD':
      return 'Password should be at least 6 characters.';
    case 'INVALID_LOGIN_CREDENTIALS':
    case 'INVALID_PASSWORD':
    case 'EMAIL_NOT_FOUND':
      return 'Invalid email or password.';
    case 'OPERATION_NOT_ALLOWED':
      return 'Email/password sign-in is not enabled in Firebase.';
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return 'Too many attempts. Try again later.';
    default:
      return message || 'Authentication failed.';
  }
}

async function postAuth<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${AUTH_BASE_URL}/${path}?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & FirebaseErrorPayload;
  if (!response.ok) {
    throw new Error(mapAuthError(data.error?.message));
  }

  return data;
}

export async function signUpWithFirebase(
  name: string,
  email: string,
  password: string,
) {
  const signedUp = await postAuth<AuthResponse>('accounts:signUp', {
    email,
    password,
    returnSecureToken: true,
  });

  let displayName = name;

  if (name.trim()) {
    try {
      const updated = await postAuth<AuthResponse>('accounts:update', {
        idToken: signedUp.idToken,
        displayName: name.trim(),
        returnSecureToken: true,
      });
      displayName = updated.displayName || name.trim();
    } catch {
      displayName = name.trim();
    }
  }

  return {
    userId: signedUp.localId,
    email: signedUp.email,
    name: displayName,
  };
}

export async function signInWithFirebase(email: string, password: string) {
  const signedIn = await postAuth<AuthResponse>('accounts:signInWithPassword', {
    email,
    password,
    returnSecureToken: true,
  });

  let displayName = '';

  try {
    const lookup = await postAuth<LookupResponse>('accounts:lookup', {
      idToken: signedIn.idToken,
    });
    displayName = lookup.users?.[0]?.displayName || '';
  } catch {
    displayName = '';
  }

  return {
    userId: signedIn.localId,
    email: signedIn.email,
    name: displayName,
  };
}
