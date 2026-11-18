import { isValidStickerId } from '../data/stickers';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { PetMessage, PetStickerId } from '../types';

interface RawMessageRow {
  id?: unknown;
  author_id?: unknown;
  author_email?: unknown;
  content?: unknown;
  sticker_id?: unknown;
  created_at?: unknown;
}

function isRawMessage(val: unknown): val is RawMessageRow {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function formatAuthorLabel(email: string): string {
  const clean = email.trim();
  if (!clean) return '飼主';
  const atIdx = clean.indexOf('@');
  return atIdx > 0 ? clean.slice(0, atIdx) : clean;
}

function parseMessageRow(raw: unknown): PetMessage | null {
  if (!isRawMessage(raw)) return null;
  const id = typeof raw.id === 'string' ? raw.id : '';
  const authorId = typeof raw.author_id === 'string' ? raw.author_id : '';
  if (!id || !authorId) return null;

  const email = typeof raw.author_email === 'string' ? raw.author_email : '';
  const content = typeof raw.content === 'string' ? raw.content : '';
  const stickerId = isValidStickerId(raw.sticker_id) ? raw.sticker_id : null;
  const createdMs =
    typeof raw.created_at === 'string' ? Date.parse(raw.created_at) : Date.now();

  return {
    id,
    authorId,
    authorName: formatAuthorLabel(email),
    content,
    stickerId,
    createdAt: Number.isFinite(createdMs) ? createdMs : Date.now(),
  };
}

export function translateMessageBoardError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return '網路連線不穩，暫時無法傳送留言。';
  }
  if (lower.includes('pet_messages') || lower.includes('does not exist')) {
    return '尚未建立留言板資料表，請先在 Supabase SQL Editor 執行最新 supabase/schema.sql。';
  }
  return message || '留言板暫時無法使用，請稍後再試。';
}

export async function fetchSharedMessages(
  sharedPetId: string
): Promise<{ messages: PetMessage[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { messages: [], error: null };
  }

  const { data, error } = await supabase
    .from('pet_messages')
    .select('id, author_id, author_email, content, sticker_id, created_at')
    .eq('shared_pet_id', sharedPetId)
    .order('created_at', { ascending: true })
    .limit(80);

  if (error) {
    return { messages: [], error: translateMessageBoardError(error.message) };
  }

  const list: PetMessage[] = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      const parsed = parseMessageRow(item);
      if (parsed) list.push(parsed);
    }
  }
  return { messages: list, error: null };
}

export async function sendSharedMessage(params: {
  sharedPetId: string;
  authorId: string;
  authorEmail: string;
  content: string;
  stickerId: PetStickerId | null;
}): Promise<{ message: PetMessage | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { message: null, error: '尚未設定 Supabase 環境變數。' };
  }

  const { data, error } = await supabase
    .from('pet_messages')
    .insert({
      shared_pet_id: params.sharedPetId,
      author_id: params.authorId,
      author_email: params.authorEmail,
      content: params.content.trim(),
      sticker_id: params.stickerId,
    })
    .select('id, author_id, author_email, content, sticker_id, created_at')
    .single();

  if (error) {
    return { message: null, error: translateMessageBoardError(error.message) };
  }

  const parsed = parseMessageRow(data);
  if (!parsed) {
    return { message: null, error: '留言回傳格式異常。' };
  }

  return { message: parsed, error: null };
}

export async function deleteSharedMessage(
  messageId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: null };
  }

  const { error } = await supabase
    .from('pet_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    return { error: translateMessageBoardError(error.message) };
  }
  return { error: null };
}

export function subscribeToSharedMessages(
  sharedPetId: string,
  callbacks: {
    onInsert: (message: PetMessage) => void;
    onDelete: (messageId: string) => void;
  }
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const client = supabase;
  const channel = client
    .channel(`pet-messages-${sharedPetId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'pet_messages',
        filter: `shared_pet_id=eq.${sharedPetId}`,
      },
      (payload) => {
        const parsed = parseMessageRow(payload.new);
        if (parsed) {
          callbacks.onInsert(parsed);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'pet_messages',
        filter: `shared_pet_id=eq.${sharedPetId}`,
      },
      (payload) => {
        const oldRow = isRawMessage(payload.old) ? payload.old : null;
        if (oldRow && typeof oldRow.id === 'string') {
          callbacks.onDelete(oldRow.id);
        }
      }
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
