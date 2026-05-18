export function animateCounters() {
  const counters = [
    { id: 'stat1', target: 500, suffix: '+' },
    { id: 'stat2', target: 450, suffix: '+' },
    { id: 'stat3', target: 8, suffix: '' },
    { id: 'stat4', target: 10, suffix: '+' }
  ];

  counters.forEach(counter => {
    const el = document.getElementById(counter.id);
    if (!el || el.dataset.counted) return;

    const rect = el.getBoundingClientRect();
    if (rect.top > window.innerHeight) return;

    el.dataset.counted = 'true';
    let current = 0;
    const step = Math.max(1, Math.floor(counter.target / 60));
    const interval = setInterval(() => {
      current += step;
      if (current >= counter.target) {
        current = counter.target;
        clearInterval(interval);
      }
      el.textContent = current + counter.suffix;
    }, 25);
  });
}
