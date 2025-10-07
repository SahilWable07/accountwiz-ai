interface DecodedToken {
  user_id: string;
  client_ids: string;
  iat: number;
  exp: number;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  clientId: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    status: string;
  };
}

export function decodeJWT(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export function saveAuthData(data: AuthData) {
  localStorage.setItem('auth_data', JSON.stringify(data));
}

export function getAuthData(): AuthData | null {
  const data = localStorage.getItem('auth_data');
  return data ? JSON.parse(data) : null;
}

export function clearAuthData() {
  localStorage.removeItem('auth_data');
}

export function isAuthenticated(): boolean {
  const authData = getAuthData();
  if (!authData) return false;

  const decoded = decodeJWT(authData.accessToken);
  if (!decoded) return false;

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp > now;
}
