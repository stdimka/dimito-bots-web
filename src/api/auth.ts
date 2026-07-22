import { api } from "./client";

export type AuthUser = {
  id: number;
  email: string;
  is_active: boolean;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  bots_provisioned: number;
};

export async function registerAccount(email: string, password: string) {
  const res = await api.post<TokenResponse>("/auth/register", {
    email: email.trim().toLowerCase(),
    password,
  });
  return res.data;
}

export async function loginAccount(email: string, password: string) {
  const res = await api.post<TokenResponse>("/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });
  return res.data;
}

export async function fetchMe() {
  const res = await api.get<AuthUser>("/auth/me");
  return res.data;
}
