import { supabase } from './supabase.js';
import { todayStr, dday, mmdd, esc, setPick, forClass } from './util.js';

const $ = (sel) => document.querySelector(sel);

// 주소에서 학년·반 읽기: class.html?grade=2&cls=7
const params = new URLSearchParams(location.search);
const grade = Number(params.get('grade') || 2);
const cls = Number(params.get('cls') || 7);
setPick(grade, cls);
$('#class-title').textContent = `${grade}학년 ${cls}반 일정`;
document.title = `${grade}학년 ${cls}반 · 샐비어 캘린더`;

// 우리 반 글 전부 한 번에 가져오기 (사진 위치까지)
const { data, error } = await forClass(
  supabase.from('posts').select('*, post_photos(path)').order('due_date'),
  grade, cls);
if (error) alert('불러오지 못했어요: ' + error.message);
const posts = data ?? [];
const today = todayStr();
const upcoming = posts.filter((p) => p.due_date >= today);
const KIND = { range: '시험범위', task: '수행평가', notice: '공지' };
const photoUrl = (path) => supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;

// 맨 위 공지 한 줄: 중요 표시된 공지
const top = upcoming.filter((p) => p.kind === 'notice' && p.important).at(-1);
if (top) $('#notice-strip').innerHTML = `<span class="badge">공지</span>${esc(top.title)}`;

// 수행평가 + 완료 체크 (체크는 이 기기에만 저장)
const tasks = upcoming.filter((p) => p.kind === 'task');
const done = JSON.parse(localStorage.getItem('salvia-done') || '{}');
function renderTasks() {
  $('#task-list').innerHTML = tasks.map((t) => `
    <li id="post-${t.id}" class="${done[t.id] ? 'done' : ''}">
      <input type="checkbox" id="t${t.id}" data-id="${t.id}" ${done[t.id] ? 'checked' : ''}>
      <span class="dday">${dday(t.due_date)}</span>
      <label for="t${t.id}"><small>${esc(t.subject ?? '')}</small><br>${esc(t.title)}</label>
      <span>${mmdd(t.due_date)} 마감</span>
      ${t.post_photos.map((ph, i) => `<a class="photo-link" href="${photoUrl(ph.path)}" target="_blank">기준표 ${i + 1}</a>`).join('')}
    </li>`).join('') || '<li>다가오는 수행평가가 없어요.</li>';
  const n = tasks.filter((t) => done[t.id]).length;
  $('#task-count').textContent = `${n} / ${tasks.length} 완료`;
  $('#task-bar').style.width = tasks.length ? `${(n / tasks.length) * 100}%` : '0';
}
$('#task-list').addEventListener('change', (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  done[id] = e.target.checked;
  localStorage.setItem('salvia-done', JSON.stringify(done));
  renderTasks();
});
renderTasks();

// 시험범위 + 과목 버튼
const ranges = upcoming.filter((p) => p.kind === 'range');
let subject = '전체';
function renderRanges() {
  const subjects = ['전체', ...new Set(ranges.map((r) => r.subject).filter(Boolean))];
  $('#subject-chips').innerHTML = subjects.map((s) =>
    `<button type="button" data-s="${esc(s)}" aria-pressed="${s === subject}">${esc(s)}</button>`).join('');
  const list = subject === '전체' ? ranges : ranges.filter((r) => r.subject === subject);
  $('#range-list').innerHTML = list.map((r) => {
    const changed = new Date(r.updated_at) - new Date(r.created_at) > 60000;
    return `<article id="post-${r.id}">
      <h3>${esc(r.subject ?? '')} ${changed ? '<span class="badge orange">범위 변경</span>' : ''}</h3>
      <p>${esc(r.body || r.title)}</p>
      ${r.post_photos.map((ph, i) => `<a class="photo-link" href="${photoUrl(ph.path)}" target="_blank">범위 사진 ${i + 1}</a>`).join('')}
    </article>`;
  }).join('') || '<p>올라온 시험범위가 없어요.</p>';
}
$('#subject-chips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-s]');
  if (b) { subject = b.dataset.s; renderRanges(); }
});
renderRanges();

// 검색
$('#search').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  const box = $('#search-results');
  if (!q) { box.innerHTML = ''; return; }
  const hits = upcoming.filter((p) => `${p.subject ?? ''} ${p.title} ${p.body}`.includes(q));
  box.innerHTML = `<p>‘${esc(q)}’ 검색 결과 ${hits.length}건</p>` +
    hits.map((p) => `<a href="#post-${p.id}">${KIND[p.kind]} · ${esc(p.title)}</a>`).join('');
});

// 달력
let [calY, calM] = today.split('-').map(Number);
function renderCalendar() {
  const firstDow = new Date(calY, calM - 1, 1).getDay();
  const last = new Date(calY, calM, 0).getDate();
  const prefix = `${calY}-${String(calM).padStart(2, '0')}-`;
  let html = ['일', '월', '화', '수', '목', '금', '토'].map((d) => `<span class="dow">${d}</span>`).join('');
  html += '<span></span>'.repeat(firstDow);
  for (let d = 1; d <= last; d++) {
    const ds = prefix + String(d).padStart(2, '0');
    const evs = posts.filter((p) => p.due_date === ds);
    html += `<div class="cell ${ds === today ? 'today' : ''} ${evs.length ? 'has' : ''}"><span class="num">${d}</span>` +
      evs.map((p) => `<span class="ev ${p.kind}">${esc(p.title)}</span>`).join('') + '</div>';
  }
  $('#cal-grid').innerHTML = html;
  $('#cal-title').textContent = `${calY}년 ${calM}월`;
}
$('#cal-prev').addEventListener('click', () => { calM--; if (calM < 1) { calM = 12; calY--; } renderCalendar(); });
$('#cal-next').addEventListener('click', () => { calM++; if (calM > 12) { calM = 1; calY++; } renderCalendar(); });
renderCalendar();

// 제보하기
$('#report-open').addEventListener('click', () => { $('#report-form').hidden = false; });
$('#report-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const { error } = await supabase.from('reports').insert({
    grade, class_no: cls, kind: f.kind.value, body: f.body.value.trim(),
  });
  $('#report-msg').textContent = error
    ? '보내지 못했어요. 잠시 뒤 다시 해 주세요.'
    : `${grade}학년 ${cls}반 입력 담당자에게 전달했어요. 고마워요!`;
  if (!error) f.reset();
});
