import { supabase } from './supabase.js';
import { getMe, logout } from './auth.js';
import { esc, mmdd } from './util.js';

const $ = (sel) => document.querySelector(sel);

// 관리자가 아니면 로그인 화면으로
const me = await getMe();
if (!me) { location.href = 'login.html'; throw new Error('관리자 아님'); }

$('#admin-label').textContent = me.role === 'teacher'
  ? `${me.name} · 선생님`
  : `${me.name} · ${me.grade}학년 ${me.class_no}반 담당`;
$('#logout').addEventListener('click', logout);

// 반 목록 채우기, 반 담당은 자기 반으로 고정
for (let c = 1; c <= 13; c++) $('#cls').insertAdjacentHTML('beforeend', `<option value="${c}">${c}반</option>`);
if (me.role === 'class') {
  $('#grade').value = me.grade;
  $('#cls').value = me.class_no;
  $('#grade').disabled = true;
  $('#cls').disabled = true;
}

// 과목 불러오기 / 추가하기
async function loadSubjects(selected) {
  const { data } = await supabase.from('subjects').select('name').order('sort');
  $('#subject').innerHTML = '<option value="">과목 없음</option>' +
    (data ?? []).map((s) => `<option>${esc(s.name)}</option>`).join('');
  if (selected) $('#subject').value = selected;
}
$('#add-subject').addEventListener('click', async () => {
  const name = $('#new-subject').value.trim();
  if (!name) return;
  const { error } = await supabase.from('subjects').insert({ name });
  if (error?.code === '23505') return alert('이미 있는 과목이에요.');
  if (error) return alert(error.message);
  $('#new-subject').value = '';
  loadSubjects(name);
});
await loadSubjects();

// 게시하기
$('#post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const msg = $('#post-msg');
  const files = [...f.photos.files];
  if (files.length > 5) return (msg.textContent = '사진은 5장까지 올릴 수 있어요.');
  if (files.some((x) => x.size > 10 * 1024 * 1024)) return (msg.textContent = '10MB보다 큰 사진이 있어요.');

  const g = $('#grade').value;
  const c = $('#cls').value;
  msg.textContent = '올리는 중…';

  // 1) 글 저장
  const { data: post, error } = await supabase.from('posts').insert({
    kind: f.kind.value,
    grade: g === 'all' ? null : Number(g),
    class_no: g === 'all' || c === 'all' ? null : Number(c),
    subject: f.subject.value || null,
    title: f.title.value.trim(),
    body: f.body.value.trim(),
    due_date: f.due.value,
    important: f.important.checked,
  }).select().single();
  if (error) return (msg.textContent = '저장 실패: ' + error.message);

  // 2) 사진 올리기 + 3) 사진 위치 기록
  for (const file of files) {
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${post.id}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from('photos').upload(path, file, { contentType: file.type });
    if (up.error) { alert(`${file.name} 업로드 실패: ${up.error.message}`); continue; }
    await supabase.from('post_photos').insert({ post_id: post.id, path });
  }

  msg.textContent = '게시했어요. 학생 화면에 바로 보여요.';
  f.reset();
  if (me.role === 'class') { $('#grade').value = me.grade; $('#cls').value = me.class_no; }
  loadMyPosts();
});

// 내가 올린 글 + 삭제
async function loadMyPosts() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from('posts').select('id, title, due_date, post_photos(path)')
    .eq('created_by', user.id).order('created_at', { ascending: false });
  const rows = data ?? [];
  $('#my-posts').innerHTML = rows.map((p) =>
    `<li><span>${mmdd(p.due_date)} · ${esc(p.title)}</span><button type="button" class="btn small gray" data-del="${p.id}">삭제</button></li>`
  ).join('') || '<li>아직 올린 글이 없어요.</li>';
  $('#my-posts').onclick = async (e) => {
    const id = e.target.dataset.del;
    if (!id || !confirm('이 글을 지울까요?')) return;
    const post = rows.find((p) => String(p.id) === id);
    const paths = post.post_photos.map((ph) => ph.path);
    if (paths.length) await supabase.storage.from('photos').remove(paths);
    await supabase.from('posts').delete().eq('id', id);
    loadMyPosts();
  };
}
loadMyPosts();

// 들어온 제보 (자물쇠 규칙 덕분에 자기 반 것만 보여요)
const { data: reports } = await supabase.from('reports').select('*')
  .order('created_at', { ascending: false }).limit(20);
$('#reports').innerHTML = (reports ?? []).map((r) =>
  `<li><span>${r.grade}-${r.class_no} · ${esc(r.kind)} · ${esc(r.body)}</span></li>`).join('') || '<li>아직 제보가 없어요.</li>';

// 선생님만: 입력 담당 신청 승인
if (me.role === 'teacher') {
  $('#approvals').hidden = false;
  async function loadRequests() {
    const { data } = await supabase.from('admin_requests').select('*')
      .eq('status', 'pending').order('created_at');
    $('#request-list').innerHTML = (data ?? []).map((r) =>
      `<li><span>${esc(r.name)} · ${r.grade}학년 ${r.class_no}반</span><button type="button" class="btn small" data-approve="${r.user_id}">승인</button></li>`
    ).join('') || '<li>기다리는 신청이 없어요.</li>';
  }
  $('#request-list').addEventListener('click', async (e) => {
    const id = e.target.dataset.approve;
    if (!id) return;
    const { error } = await supabase.rpc('approve_request', { target: id });
    if (error) alert(error.message);
    loadRequests();
  });
  loadRequests();
}
