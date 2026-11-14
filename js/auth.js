import { supabase } from './supabase.js';

// 아이디 → 로그인용 이메일 ('2-7' → '2-7@jjalimi.example')
// 이미 이메일 모양이면(@가 있으면) 그대로 써요
export const toEmail = (id) => {
  const v = id.trim().toLowerCase();
  return v.includes('@') ? v : `${v}@jjalimi.example`;
};

// 지금 로그인한 사람이 관리자 명단에 있으면 그 정보를, 아니면 null
export async function getMe() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data } = await supabase.from('admins').select('*')
    .eq('user_id', session.user.id).maybeSingle();
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
  location.href = 'index.html';
}
