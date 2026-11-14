// 오늘 날짜 (한국 시간) → '2026-11-14'
export function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

// 남은 날짜 → 'D-24'
export function dday(dateStr) {
  const diff = Math.round((Date.parse(dateStr) - Date.parse(todayStr())) / 86400000);
  if (diff === 0) return 'D-DAY';
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

// '2026-11-09' → '11.09'
export const mmdd = (d) => d.slice(5).replace('-', '.');

// 글자를 화면에 안전하게 넣기
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 마지막으로 고른 반 기억하기
export function getPick() {
  try { return JSON.parse(localStorage.getItem('salvia-pick')); } catch { return null; }
}
export function setPick(grade, cls) {
  localStorage.setItem('salvia-pick', JSON.stringify({ grade, cls }));
}

// 이 반에 보여 줄 글만 고르기: 학교 전체 + 우리 학년 전체 + 우리 반
export function forClass(query, grade, cls) {
  return query.or(
    `grade.is.null,and(grade.eq.${grade},class_no.is.null),and(grade.eq.${grade},class_no.eq.${cls})`
  );
}
