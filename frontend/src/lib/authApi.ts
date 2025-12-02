export interface AuthUser {
  id: string;
  email: string;
  role: string;
  created_at?: string | Date;
}

interface AuthResponse {
  user: AuthUser;
}

const API_URL = import.meta.env.VITE_API_URL;

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data: AuthResponse | { error?: string } = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || !("user" in data)) {
    throw new Error(
      data && "error" in data && data.error ? data.error : "Login failed"
    );
  }

  return (data as AuthResponse).user;
}

export async function register(
  email: string,
  password: string
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data: AuthResponse | { error?: string } = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || !("user" in data)) {
    throw new Error(
      data && "error" in data && data.error ? data.error : "Registration failed"
    );
  }

  return (data as AuthResponse).user;
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  const data: AuthResponse | { error?: string } = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || !("user" in data)) {
    return null;
  }

  return (data as AuthResponse).user;
}

export async function deleteUrl(shortCode: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/urls/${encodeURIComponent(shortCode)}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      data && "error" in data && data.error ? data.error : "Failed to delete URL";
    throw new Error(message);
  }
}


