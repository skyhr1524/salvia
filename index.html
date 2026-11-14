import { supabase } from './supabase.js';
import { todayStr, dday, mmdd, esc, getPick, setPick, forClass } from './util.js';

const $ = (sel) => document.querySelector(sel);
const pick = getPick() ?? { grade: 2, cls: 7 };
const today = todayStr();

// 1) 아이콘 메뉴: 마지막으로 본 반으로 연결
document.querySelectorAll('[data-to]').forEach((a) => {
  a.href = `class.html?grade=${pick.grade}&cls=${pick.cls}${a.dataset.to}`;
});

// 2) 학년·반 버튼
let grade = pick.grade;
function renderPicker() {
  $('#grade-buttons').innerHTML = [1, 2, 3].map((g) =>
    `<button type="button" data-grade="${g}" aria-pressed="${g === grade}">${g}학년</button>`).join('');
  $('#class-buttons').innerHTML = Array.from({ length: 13 }, (_, i) => i + 1).map((c) =>
    `<a href="class.html?grade=${grade}&cls=${c}" data-cls="${c}">${c}반</a>`).join('');
}
$('#grade-buttons').addEventListener('click', (e) => {
  const b = e.target.closest('[data-grade]');
  if (b) { grade = Number(b.dataset.grade); renderPicker(); }
});
$('#class-buttons').addEventListener('click', (e) => {
  const a = e.target.closest('[data-cls]');
  if (a) setPick(grade, Number(a.dataset.cls));
});
renderPicker();

// 3) 노란 카드: 아직 안 끝난 시험 중 가장 빠른 것
const { data: exams } = await supabase.from('exams').select('*')
  .gte('end_date', today).order('start_date').limit(1);
const exam = exams?.[0];
if (exam) {
  $('#exam-name').textContent = exam.name;
  $('#exam-dday').textContent = dday(exam.start_date);
  $('#exam-range').textContent = `${exam.start_date.slice(5).replace('-', '월 ')}일 ~ ${exam.end_date.slice(5).replace('-', '월 ')}일`;
} else {
  $('#exam-name').textContent = '예정된 시험이 없어요';
}

// 4) 다가오는 일정 6개 (마지막으로 본 반 기준)
const { data: eventRows } = await forClass(
  supabase.from('posts').select('subject, title, due_date')
    .gte('due_date', today).order('due_date').limit(6),
  pick.grade, pick.cls);
const events = eventRows ?? [];
$('#events').innerHTML = events.length
  ? events.map((p) => `<li><span class="chip">${mmdd(p.due_date)}</span>${esc(p.subject ?? '')} ${esc(p.title)}</li>`).join('')
  : '<li>다가오는 일정이 없어요.</li>';

// 5) 날짜 띠: 이번 달 1일~마지막 날
const [y, m] = today.split('-').map(Number);
$('#month-title').textContent = `${y}.${String(m).padStart(2, '0')}`;
const lastDay = new Date(y, m, 0).getDate();
const eventDays = new Set(events.map((p) => p.due_date));
$('#date-strip').innerHTML = Array.from({ length: lastDay }, (_, i) => {
  const d = i + 1;
  const ds = `${today.slice(0, 8)}${String(d).padStart(2, '0')}`;
  const dow = new Date(y, m - 1, d).getDay();
  const cls = [dow === 0 && 'sun', dow === 6 && 'sat', ds === today && 'today', eventDays.has(ds) && 'has-event']
    .filter(Boolean).join(' ');
  return `<li class="${cls}">${String(d).padStart(2, '0')}</li>`;
}).join('');

// 6) 공지 최신 5개
const { data: notices } = await forClass(
  supabase.from('posts').select('title, created_at').eq('kind', 'notice')
    .order('created_at', { ascending: false }).limit(5),
  pick.grade, pick.cls);
$('#notice-list').innerHTML = (notices ?? []).length
  ? notices.map((n) => `<li><span class="title">${esc(n.title)}</span><span class="date">${n.created_at.slice(0, 10).replaceAll('-', '.')}</span></li>`).join('')
  : '<li>아직 공지가 없어요.</li>';
