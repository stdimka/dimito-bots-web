import { create } from "zustand";
import {
  fetchMe,
  loginAccount,
  registerAccount,
  type AuthUser,
} from "../api/auth";
import { getApiErrorMessage, setAccessToken } from "../api/client";
import { useBotsStore } from "./botsStore";

const TOKEN_KEY = "dimito-web-token";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

async function applySession(token: string): Promise<AuthUser> {
  setAccessToken(token);
  localStorage.setItem(TOKEN_KEY, token);
  return fetchMe();
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  hydrate: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setAccessToken(null);
        set({ token: null, user: null, hydrated: true });
        return;
      }
      setAccessToken(token);
      try {
        const user = await fetchMe();
        set({ token, user, hydrated: true, error: null });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setAccessToken(null);
        set({ token: null, user: null, hydrated: true });
      }
    } catch {
      set({ token: null, user: null, hydrated: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await loginAccount(email, password);
      const user = await applySession(data.access_token);
      set({ token: data.access_token, user, loading: false, error: null });
      await useBotsStore.getState().fetchBots();
    } catch (e) {
      set({ loading: false, error: getApiErrorMessage(e) });
      throw e;
    }
  },

  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await registerAccount(email, password);
      const user = await applySession(data.access_token);
      set({ token: data.access_token, user, loading: false, error: null });
      await useBotsStore.getState().fetchBots();
    } catch (e) {
      set({ loading: false, error: getApiErrorMessage(e) });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
    useBotsStore.getState().reset();
    set({ token: null, user: null, error: null });
  },
}));
