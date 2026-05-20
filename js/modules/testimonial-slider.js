let currentSlide = 0;
let totalSlides = 4;
let autoSlideInterval;

export function renderTestimonials(testimonials) {
  const track = document.getElementById('testimonialTrack');
  if (!track) return;
  track.innerHTML = '';
  
  testimonials.forEach(t => {
    const card = document.createElement('div');
    card.className = 'testimonial-card';
    card.innerHTML = `
      <div class="testimonial-inner">
        <div class="testimonial-quote">&ldquo;</div>
        <blockquote>${t.quote}</blockquote>
        <div class="testimonial-author">
          <strong>${t.author}</strong>
          <span>${t.role}</span>
        </div>
      </div>
    `;
    track.appendChild(card);
  });
  
  initTestimonialSlider(testimonials.length);
}

export function initTestimonialSlider(count) {
  if (count !== undefined) {
    totalSlides = count;
  }

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
  if (totalSlides > 0) {
    goToSlide((currentSlide + 1) % totalSlides);
  }
}

function startAutoSlide() {
  clearInterval(autoSlideInterval);
  if (totalSlides > 0) {
    autoSlideInterval = setInterval(nextSlide, 5000);
  }
}

