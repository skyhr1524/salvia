import { supabase } from './supabase.js';
import { esc, getPick, forClass } from './util.js';

const pick = getPick() ?? { grade: 2, cls: 7 };
document.querySelector('#pick-label').textContent = `${pick.grade}학년 ${pick.cls}반 기준`;

// 우리 반에 보이는 공지 전부 (중요한 것 먼저, 그다음 최신순)
const { data } = await forClass(
  supabase.from('posts').select('*').eq('kind', 'notice')
    .order('important', { ascending: false })
    .order('created_at', { ascending: false }),
  pick.grade, pick.cls);
const notices = data ?? [];

// 누구에게 보내는 공지인지
const target = (n) => n.grade == null ? '학교 전체'
  : n.class_no == null ? `${n.grade}학년 전체` : `${n.grade}학년 ${n.class_no}반`;

function render(filter) {
  const list = notices.filter((n) =>
    filter === 'all' || (filter === 'school' ? n.grade == null : n.grade != null));
  document.querySelector('#notice-full').innerHTML = list.map((n, i) => `
    <details ${i === 0 ? 'open' : ''}>
      <summary>
        ${n.important ? '<span class="badge">중요</span>' : ''}
        <strong>${esc(n.title)}</strong>
        <small>${target(n)} · ${n.created_at.slice(0, 10).replaceAll('-', '.')}</small>
      </summary>
      <p>${esc(n.body) || '내용 없음'}</p>
    </details>`).join('') || '<p>공지가 없어요.</p>';
}

// 전체 / 학교 전체 / 우리 반 버튼
document.querySelector('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]');
  if (!b) return;
  document.querySelectorAll('#filters button').forEach((x) => x.setAttribute('aria-pressed', x === b));
  render(b.dataset.f);
});
render('all');
