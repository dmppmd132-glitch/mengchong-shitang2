import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { GameState, SharedPetRoom } from '../types';
import { normalizeGameState } from '../utils/storage';

interface RawSharedPetRow {
  id?: unknown;
  invite_code?: unknown;
  owner_id?: unknown;
  owner_email?: unknown;
  partner_id?: unknown;
  partner_email?: unknown;
  save_data?: unknown;
  last_actor_id?: unknown;
  last_actor_email?: unknown;
  updated_at?: unknown;
}

function isRawRecord(val: unknown): val is RawSharedPetRow {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function parseSharedPetRow(
  raw: unknown
): { room: SharedPetRoom; state: GameState | null } | null {
  if (!isRawRecord(raw)) return null;
  const id = typeof raw.id === 'string' ? raw.id : '';
  const inviteCode = typeof raw.invite_code === 'string' ? raw.invite_code : '';
  const ownerId = typeof raw.owner_id === 'string' ? raw.owner_id : '';
  if (!id || !inviteCode || !ownerId) return null;

  const room: SharedPetRoom = {
    id,
    inviteCode,
    ownerId,
    ownerEmail: typeof raw.owner_email === 'string' ? raw.owner_email : '',
    partnerId: typeof raw.partner_id === 'string' ? raw.partner_id : null,
    partnerEmail: typeof raw.partner_email === 'string' ? raw.partner_email : null,
    lastActorId: typeof raw.last_actor_id === 'string' ? raw.last_actor_id : null,
    lastActorEmail: typeof raw.last_actor_email === 'string' ? raw.last_actor_email : null,
    updatedAt:
      typeof raw.updated_at === 'string' ? raw.updated_at : new Date().toISOString(),
  };

  const state = normalizeGameState(raw.save_data);
  return { room, state };
}

export function translateSharedPetError(message: string): string {
  const upper = message.toUpperCase();
  if (upper.includes('NOT_AUTHENTICATED')) {
    return '請先登入雲端帳號後再使用兩人共養功能。';
  }
  if (upper.includes('INVALID_INVITE_CODE')) {
    return '請輸入 6 碼英文與數字組成的邀請碼。';
  }
  if (upper.includes('INVITE_NOT_FOUND')) {
    return '找不到這組邀請碼，請確認大小寫或向夥伴重新索取。';
  }
  if (upper.includes('ROOM_FULL')) {
    return '這隻小豬已經有兩位飼主在共養了！';
  }
  if (upper.includes('ALREADY_IN_SHARED_PET')) {
    return '您目前已加入另一間共養小屋，請先退出後再加入新的邀請碼。';
  }
  if (upper.includes('SHARED_PET_NOT_FOUND')) {
    return '找不到對應的共養小屋，可能已被解散。';
  }
  if (upper.includes('FAILED TO FETCH') || upper.includes('NETWORK')) {
    return '網路連線不穩，暫時無法連線至共養伺服器。';
  }
  if (upper.includes('COULD NOT FIND THE FUNCTION') || upper.includes('42883')) {
    return '資料庫尚未建立共養函式，請先在 Supabase SQL Editor 執行最新 supabase/schema.sql。';
  }
  return message || '共養服務暫時無法使用，請稍後再試。';
}

export async function fetchMySharedPet(
  userId: string
): Promise<{ room: SharedPetRoom | null; state: GameState | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { room: null, state: null, error: null };
  }

  const { data, error } = await supabase
    .from('shared_pets')
    .select('*')
    .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
    .maybeSingle();

  if (error) {
    return { room: null, state: null, error: translateSharedPetError(error.message) };
  }

  if (!data) {
    return { room: null, state: null, error: null };
  }

  const parsed = parseSharedPetRow(data);
  if (!parsed) {
    return { room: null, state: null, error: '共養小屋資料格式異常。' };
  }

  return { room: parsed.room, state: parsed.state, error: null };
}

export async function createSharedPetRoom(
  saveData: GameState,
  ownerEmail: string
): Promise<{ room: SharedPetRoom | null; state: GameState | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { room: null, state: null, error: '尚未設定 Supabase 環境變數。' };
  }

  const payloadState: GameState = {
    ...saveData,
    lastSavedAt: Date.now(),
  };

  const { data, error } = await supabase.rpc('create_shared_pet', {
    p_save_data: payloadState,
    p_owner_email: ownerEmail,
  });

  if (error) {
    return { room: null, state: null, error: translateSharedPetError(error.message) };
  }

  const parsed = parseSharedPetRow(data);
  if (!parsed) {
    return { room: null, state: null, error: '建立共養小屋失敗，請稍後再試。' };
  }

  return { room: parsed.room, state: parsed.state, error: null };
}

export async function joinSharedPetByCode(
  inviteCode: string,
  partnerEmail: string
): Promise<{ room: SharedPetRoom | null; state: GameState | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { room: null, state: null, error: '尚未設定 Supabase 環境變數。' };
  }

  const cleanCode = inviteCode.trim().toUpperCase();
  if (cleanCode.length !== 6) {
    return { room: null, state: null, error: '請輸入完整的 6 碼邀請碼。' };
  }

  const { data, error } = await supabase.rpc('join_shared_pet', {
    p_invite_code: cleanCode,
    p_partner_email: partnerEmail,
  });

  if (error) {
    return { room: null, state: null, error: translateSharedPetError(error.message) };
  }

  const parsed = parseSharedPetRow(data);
  if (!parsed) {
    return { room: null, state: null, error: '加入共養小屋失敗，請稍後再試。' };
  }

  return { room: parsed.room, state: parsed.state, error: null };
}

export async function updateSharedPetSave(
  roomId: string,
  state: GameState,
  actorId: string,
  actorEmail: string
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
    .from('shared_pets')
    .update({
      save_data: payloadState,
      last_actor_id: actorId,
      last_actor_email: actorEmail,
      updated_at: nowIso,
    })
    .eq('id', roomId)
    .select('updated_at')
    .maybeSingle();

  if (error) {
    return { updatedAt: null, error: translateSharedPetError(error.message) };
  }

  const row = isRawRecord(data) ? data : null;
  const updatedAt = row && typeof row.updated_at === 'string' ? row.updated_at : nowIso;
  return { updatedAt, error: null };
}

export async function regenerateSharedInviteCode(
  roomId: string
): Promise<{ room: SharedPetRoom | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { room: null, error: '尚未設定 Supabase 環境變數。' };
  }

  const { data, error } = await supabase.rpc('regenerate_invite_code', {
    p_shared_pet_id: roomId,
  });

  if (error) {
    return { room: null, error: translateSharedPetError(error.message) };
  }

  const parsed = parseSharedPetRow(data);
  if (!parsed) {
    return { room: null, error: '更新邀請碼失敗，請稍後再試。' };
  }

  return { room: parsed.room, error: null };
}

export async function leaveSharedPetRoom(
  roomId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: null };
  }

  const { error } = await supabase.rpc('leave_shared_pet', {
    p_shared_pet_id: roomId,
  });

  if (error) {
    return { error: translateSharedPetError(error.message) };
  }

  return { error: null };
}

export function subscribeToSharedPet(
  roomId: string,
  onRemoteChange: (room: SharedPetRoom | null, state: GameState | null, deleted: boolean) => void
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const client = supabase;
  const channel = client
    .channel(`shared-pet-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shared_pets',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onRemoteChange(null, null, true);
          return;
        }
        const parsed = parseSharedPetRow(payload.new);
        if (parsed) {
          onRemoteChange(parsed.room, parsed.state, false);
        }
      }
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
