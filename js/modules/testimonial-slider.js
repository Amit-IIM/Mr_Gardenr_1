let currentSlide = 0;
const totalSlides = 4;
let autoSlideInterval;

export function initTestimonialSlider() {
  const nav = document.getElementById('testimonialNav');
  if (!nav) return;

  // Clear nav in case of re-init
  nav.innerHTML = '';

  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('button');
    dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
    dot.onclick = () => goToSlide(i);
    nav.appendChild(dot);
  }

  startAutoSlide();
}

export function goToSlide(index) {
  currentSlide = index;
  const track = document.getElementById('testimonialTrack');
  if (!track) return;
  track.style.transform = `translateX(-${index * 100}%)`;

  document.querySelectorAll('.testimonial-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

function nextSlide() {
  goToSlide((currentSlide + 1) % totalSlides);
}

function startAutoSlide() {
  clearInterval(autoSlideInterval);
  autoSlideInterval = setInterval(nextSlide, 5000);
}
