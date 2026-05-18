export function initMagneticButtons() {
  const btns = document.querySelectorAll('.btn');
  if (!btns.length) return;

  btns.forEach(btn => {
    // avoid multiple bindings
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('mousemove', (e) => {
      const rect = newBtn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Calculate magnetic pull strength (e.g., 0.3 for X, 0.5 for Y)
      newBtn.style.setProperty('--tx', `${x * 0.3}px`);
      newBtn.style.setProperty('--ty', `${y * 0.5}px`);
    });

    newBtn.addEventListener('mouseleave', () => {
      newBtn.style.setProperty('--tx', `0px`);
      newBtn.style.setProperty('--ty', `0px`);
    });
  });
}
