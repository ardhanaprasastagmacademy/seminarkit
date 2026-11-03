// src/lib/admin-client.ts
import { getSupabaseBrowser } from './supabase';

export interface AdminSession {
  email: string;
  name: string;
  token: string;
  user?: any;
}

export function getLocalAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('sk_admin_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setLocalAdminSession(session: AdminSession) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sk_admin_session', JSON.stringify(session));
    document.cookie = `sk_admin_session=active; path=/; max-age=604800; SameSite=Lax`;
  } catch {}
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('sk_admin_session');
    document.cookie = 'sk_admin_session=; path=/; max-age=0; SameSite=Lax';
  } catch {}
}

export async function verifyActiveSession(): Promise<AdminSession | null> {
  const local = getLocalAdminSession();
  if (local) return local;

  try {
    const sb = getSupabaseBrowser();
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      const email = session.user.email || 'adminseminarkit@gmail.com';
      const prefix = email.split('@')[0];
      const name = prefix.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const s: AdminSession = {
        email,
        name,
        token: session.access_token,
        user: session.user,
      };
      setLocalAdminSession(s);
      return s;
    }
  } catch {}

  return null;
}

export async function fetchAdminData(table: string): Promise<any> {
  const session = getLocalAdminSession();
  const token = session?.token || 'sk-admin-master-token';

  const res = await fetch(`/api/admin/manage?table=${encodeURIComponent(table)}`, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `Gagal mengambil data ${table}`);
  }
  return json.data;
}

export async function postAdminAction(action: string, payload: any = {}): Promise<any> {
  const session = getLocalAdminSession();
  const token = session?.token || 'sk-admin-master-token';

  const res = await fetch('/api/admin/manage', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `Gagal menjalankan aksi ${action}`);
  }
  return json;
}
