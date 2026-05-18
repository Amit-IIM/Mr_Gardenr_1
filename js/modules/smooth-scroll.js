export function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const targetId = link.getAttribute('href');
    if(targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // close mobile nav if open
      const nav = document.getElementById('mobileNav');
      if(nav && nav.classList.contains('active')) {
          nav.classList.remove('active');
          document.body.style.overflow = '';
      }
    }
  });
}
