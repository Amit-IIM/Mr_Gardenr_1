export function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  if(!btn) return;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check-circle"></i> Request Submitted!';
  btn.style.background = '#4a8a6f';
  btn.disabled = true;

  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.background = '';
    btn.disabled = false;
    e.target.reset();
  }, 3000);
}
window.handleSubmit = handleSubmit;
