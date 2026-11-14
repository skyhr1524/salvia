import { supabase } from './supabase.js';
import { toEmail, getMe } from './auth.js';

const $ = (sel) => document.querySelector(sel);

// 이미 로그인한 관리자면 바로 관리자 화면으로
if (await getMe()) location.href = 'admin.html';

// 반 목록 1~13반 채우기
for (let c = 1; c <= 13; c++) $('#su-cls').insertAdjacentHTML('beforeend', `<option value="${c}">${c}반</option>`);

// 로그인 / 가입 신청 탭 바꾸기
function show(which) {
  $('#login-form').hidden = which !== 'login';
  $('#signup-form').hidden = which !== 'signup';
  document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tab === which));
}
$('.tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) show(b.dataset.tab);
});

function say(el, text, isError) {
  el.textContent = text;
  el.classList.toggle('error', !!isError);
}

// 로그인
let fails = Number(sessionStorage.getItem('fails') || 0);
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const msg = $('#login-msg');
  if (fails >= 5) return say(msg, '로그인에 5번 실패했어요. 담당 선생님께 문의해 주세요.', true);

  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(f.userId.value), password: f.password.value,
  });
  if (error) {
    fails++;
    sessionStorage.setItem('fails', fails);
    return say(msg, `아이디나 비밀번호가 맞지 않아요. (${fails}/5)`, true);
  }
  sessionStorage.removeItem('fails');

  if (await getMe()) { location.href = 'admin.html'; return; }
  await supabase.auth.signOut();
  say(msg, '아직 선생님 승인 전이에요. 승인되면 다시 로그인해 주세요.');
});

// 가입하고 담당 신청하기
$('#signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const msg = $('#signup-msg');
  const id = f.userId.value.trim();
  if (!/^[a-zA-Z0-9-]{2,20}$/.test(id)) return say(msg, '아이디는 영어, 숫자, - 로 2~20자로 써 주세요. 예: 2-7', true);
  if (f.password.value.length < 8) return say(msg, '비밀번호는 8자 이상이어야 해요.', true);

  const { data, error } = await supabase.auth.signUp({ email: toEmail(id), password: f.password.value });
  if (error) return say(msg, error.message.includes('registered') ? '이미 있는 아이디예요.' : '가입 실패: ' + error.message, true);
  if (!data.session) return say(msg, 'Supabase에서 Confirm email이 꺼져 있는지 확인해 주세요.', true);

  const { error: e2 } = await supabase.from('admin_requests').insert({
    name: f.name.value.trim(), grade: Number(f.grade.value), class_no: Number(f.cls.value),
  });
  await supabase.auth.signOut();
  if (e2) return say(msg, '신청서 저장 실패: ' + e2.message, true);
  say(msg, '신청했어요! 선생님이 승인하면 로그인할 수 있어요.');
  f.reset();
});
