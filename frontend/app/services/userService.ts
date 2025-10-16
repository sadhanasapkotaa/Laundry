export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

const API_BASE = "/api/auth"; // Django app uses /api/auth/ for user endpoints

// Global access token variable (you can manage it in state or context)
let accessToken: string | null = null;

const UserService = {
  setAccessToken: (token: string) => {
    accessToken = token;
  },

  register: async (payload: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    password: string;
  }): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Registration failed");
    return res.json();
  },

  verifyEmail: async (payload: { email: string; code: string }): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/verify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Email verification failed");
    return res.json();
  },

  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Login failed");
    const data: AuthResponse = await res.json();
    accessToken = data.access; // store access token after login
    return data;
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const res = await fetch(`${API_BASE}/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) throw new Error("Token refresh failed");
    const data = await res.json();
    accessToken = data.access; // update token
    return data;
  },

  getProfile: async (): Promise<User> => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No access token found");

    const res = await fetch(`${API_BASE}/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  },

  updateProfile: async (payload: Partial<User>): Promise<User> => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No access token found");

    const res = await fetch(`${API_BASE}/update-profile/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  },

  logout: async (): Promise<{ message: string }> => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No access token found");

    const res = await fetch(`${API_BASE}/logout/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Logout failed");
    return res.json();
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/password-reset/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Password reset request failed");
    return res.json();
  },

  confirmPasswordReset: async (uid64: string, token: string, new_password: string) => {
    const res = await fetch(`${API_BASE}/password-reset-confirm/${uid64}/${token}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password }),
    });
    if (!res.ok) throw new Error("Password reset confirmation failed");
    return res.json();
  },

  setNewPassword: async (payload: { email: string; code: string; new_password: string }) => {
    const res = await fetch(`${API_BASE}/set-new-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Setting new password failed");
    return res.json();
  },
};

export default UserService;
