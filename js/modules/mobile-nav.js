export function toggleMobileNav() {
  const nav = document.getElementById('mobileNav');
  if(!nav) return;
  nav.classList.toggle('active');
  document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
}
// Attach to window so inline onclick works
window.toggleMobileNav = toggleMobileNav;
