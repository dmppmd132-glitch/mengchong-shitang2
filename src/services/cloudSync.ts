import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { CloudUser, GameState } from '../types';
import { normalizeGameState } from '../utils/storage';

export function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Email 或密碼不正確，請再確認一次。';
  }
  if (lower.includes('email not confirmed')) {
    return '此帳號尚未完成信箱驗證，請先點擊驗證信中的連結。';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return '此 Email 已經註冊過了，請直接切換至「登入」。';
  }
  if (lower.includes('password should be at least')) {
    return '密碼長度至少需要 6 個字元。';
  }
  if (lower.includes('unable to validate email address') || lower.includes('invalid email')) {
    return '請輸入有效的 Email 格式。';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return '操作過於頻繁，請稍候片刻再試。';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return '網路連線不穩，目前無法連線至雲端伺服器。';
  }
  return message || '雲端服務暫時無法使用，請稍後再試。';
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: CloudUser | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: '尚未設定 Supabase 環境變數，目前僅使用本機存檔。' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { user: null, error: translateAuthError(error.message) };
  }

  if (!data.user) {
    return { user: null, error: '登入失敗，請稍後再試。' };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? email.trim(),
    },
    error: null,
  };
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ user: CloudUser | null; needsEmailConfirmation: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      user: null,
      needsEmailConfirmation: false,
      error: '尚未設定 Supabase 環境變數，目前僅使用本機存檔。',
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) {
    return {
      user: null,
      needsEmailConfirmation: false,
      error: translateAuthError(error.message),
    };
  }

  if (!data.user) {
    return {
      user: null,
      needsEmailConfirmation: false,
      error: '註冊失敗，請稍後再試。',
    };
  }

  const needsEmailConfirmation = !data.session;
  return {
    user: data.session
      ? {
          id: data.user.id,
          email: data.user.email ?? email.trim(),
        }
      : null,
    needsEmailConfirmation,
    error: null,
  };
}

export async function signOutCloud(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: null };
  }
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: translateAuthError(error.message) };
  }
  return { error: null };
}

export async function fetchCloudSave(
  userId: string
): Promise<{ state: GameState | null; updatedAt: string | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { state: null, updatedAt: null, error: '尚未設定 Supabase 環境變數。' };
  }

  const { data, error } = await supabase
    .from('pet_saves')
    .select('save_data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { state: null, updatedAt: null, error: translateAuthError(error.message) };
  }

  if (!data) {
    return { state: null, updatedAt: null, error: null };
  }

  const row = data as { save_data?: unknown; updated_at?: unknown };
  const normalized = normalizeGameState(row.save_data);
  const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : null;

  if (!normalized) {
    return { state: null, updatedAt, error: '雲端存檔格式異常，無法載入。' };
  }

  return { state: normalized, updatedAt, error: null };
}

export async function upsertCloudSave(
  userId: string,
  state: GameState
): Promise<{ updatedAt: string | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { updatedAt: null, error: '尚未設定 Supabase 環境變數。' };
  }

  const nowIso = new Date().toISOString();
  const payloadState: GameState = {
    ...state,
    lastSavedAt: Date.now(),
  };

  const { data, error } = await supabase
    .from('pet_saves')
    .upsert(
      {
        user_id: userId,
        save_data: payloadState,
        updated_at: nowIso,
      },
      { onConflict: 'user_id' }
    )
    .select('updated_at')
    .single();

  if (error) {
    return { updatedAt: null, error: translateAuthError(error.message) };
  }

  const row = data as { updated_at?: unknown } | null;
  const updatedAt = row && typeof row.updated_at === 'string' ? row.updated_at : nowIso;
  return { updatedAt, error: null };
}
