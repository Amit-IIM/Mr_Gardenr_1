export function handleNavScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.1)';
  } else {
    navbar.style.boxShadow = '0 1px 20px rgba(0,0,0,0.06)';
  }
}
