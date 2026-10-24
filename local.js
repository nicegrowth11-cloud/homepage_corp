'use strict';
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const modal = document.querySelector('#consultation');
const form = document.querySelector('#consult-form');
const service = document.querySelector('#service');
const result = document.querySelector('#consult-result');
const summary = document.querySelector('#consult-summary');
const copyStatus = document.querySelector('#copy-status');
const topics = Object.freeze({
  establish: {
    label: '법인 설립',
    title: '법인 설립 무엇이 궁금하세요?',
    description: '설립 비용과 준비 서류, 예정 업종 등 궁금한 내용을 정리해주세요.',
    placeholder: '예: 온라인 판매 법인을 준비 중입니다. 설립 비용과 준비 서류를 알고 싶습니다.'
  },
  conversion: {
    label: '법인 전환',
    title: '법인 전환 어떤 준비가 필요하신가요?',
    description: '현재 개인사업자의 업종과 전환 목적, 희망 시기를 알려주세요.',
    placeholder: '예: 개인사업자로 운영 중이며 공동 투자와 법인 전환을 검토하고 있습니다.'
  },
  operation: {
    label: '세무 관리',
    title: '운영의 모든 것 무엇이든 물어보세요',
    description: '기장·신고, 급여·증빙 관리 등 현재 운영에서 필요한 도움을 정리해주세요.',
    placeholder: '예: 설립한 법인의 기장과 급여 관리에 대해 상담하고 싶습니다.'
  }
});
function closeMenu() {
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', '메뉴 열기');
  navigation.classList.remove('open');
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  navigation.classList.toggle('open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    toggle.focus();
  }
});
function updateTopic(value) {
  const topic = topics[value] || topics.establish;
  document.querySelector('#consult-title').textContent = topic.title;
  document.querySelector('#consult-description').textContent = topic.description;
  document.querySelector('#message').placeholder = topic.placeholder;
  result.hidden = true;
  summary.textContent = '';
  copyStatus.textContent = '';
}
document.querySelectorAll('[data-consult]').forEach(button => {
  button.addEventListener('click', () => {
    closeMenu();
    service.value = Object.hasOwn(topics, button.dataset.consult) ? button.dataset.consult : 'establish';
    updateTopic(service.value);
    modal.showModal();
  });
});
service.addEventListener('change', () => updateTopic(service.value));
modal.querySelector('.close').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => {
  if (event.target !== modal) return;
  const rect = modal.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
});
// Clear personal text when the dialog is closed. No form input is persisted or sent.
modal.addEventListener('close', () => {
  form.reset();
  result.hidden = true;
  summary.textContent = '';
  copyStatus.textContent = '';
});
// Remove the previous implementation's one local draft, without reading its contents.
try { localStorage.removeItem('ceopartners-consultation'); } catch { /* Storage may be unavailable. */ }
function plainText(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, maxLength);
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const topic = topics[data.get('service')] || topics.establish;
  // Use textContent only: markup or SQL-like strings remain plain text, never executable code.
  summary.textContent = [
    `상담 분야: ${topic.label}`,
    `성함: ${plainText(data.get('name'), 50) || '미기재'}`,
    `연락처: ${plainText(data.get('phone'), 20) || '미기재'}`,
    '',
    plainText(data.get('message'), 2000)
  ].join('\n');
  result.hidden = false;
  copyStatus.textContent = '문의 내용이 화면에 정리되었습니다. 아직 접수되지 않았습니다.';
});
document.querySelector('#copy-summary').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(summary.textContent);
    copyStatus.textContent = '복사했습니다. 이메일 작성 시 직접 붙여넣어 문의할 수 있습니다.';
  } catch {
    copyStatus.textContent = '자동 복사를 사용할 수 없습니다. 위 내용을 직접 선택해 복사해주세요.';
  }
});
