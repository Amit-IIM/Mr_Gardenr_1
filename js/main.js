import { toggleMobileNav } from './modules/mobile-nav.js';
import { revealOnScroll } from './modules/scroll-reveal.js';
import { animateCounters } from './modules/counter-animation.js';
import { initTestimonialSlider, renderTestimonials } from './modules/testimonial-slider.js';
import { renderGallery } from './modules/gallery.js';
import { handleNavScroll } from './modules/navbar-scroll.js';
import { handleSubmit } from './modules/contact-form.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initStoreLocator } from './modules/store-locator.js';
import { initMagneticButtons } from './modules/magnetic-buttons.js';
import { initAppointmentBooking } from './modules/appointment.js';

async function loadIncludes() {
  const includes = document.querySelectorAll('[data-include]');
  const fetchPromises = Array.from(includes).map(async (el) => {
    const file = el.getAttribute('data-include');
    try {
      const response = await fetch(file);
      if (response.ok) {
        const text = await response.text();
        el.outerHTML = text; // Replace placeholder with content
      } else {
        console.error(`Failed to load ${file}`);
      }
    } catch (err) {
      console.error(`Error loading ${file}:`, err);
    }
  });

  await Promise.all(fetchPromises);
  
  // Initialize all modules once HTML is loaded
  initAll();
}

async function loadDynamicContent() {
  try {
    const res = await fetch('data/content.json');
    if (res.ok) {
      const data = await res.json();
      if (data.testimonials && data.testimonials.length > 0) {
        renderTestimonials(data.testimonials);
      } else {
        initTestimonialSlider();
      }
      if (data.gallery && data.gallery.length > 0) {
        renderGallery(data.gallery);
      }
    } else {
      console.warn("Dynamic database content.json not found, utilizing HTML static fallback");
      initTestimonialSlider();
    }
  } catch (err) {
    console.error("Error loading dynamic content:", err);
    initTestimonialSlider();
  }
}

function initAll() {
  // Navigation
  window.addEventListener('scroll', handleNavScroll);
  handleNavScroll(); // run once on load

  // Smooth scroll
  initSmoothScroll();

  // Animations
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // run once on load
  
  // Counters
  window.addEventListener('scroll', animateCounters);
  animateCounters(); // run once on load
  
  // Dynamic Content (Slider & Gallery)
  loadDynamicContent();

  // Appointment Booking
  initAppointmentBooking();

  // Store Locator
  initStoreLocator();

  // Magnetic Buttons
  initMagneticButtons();
}

// Start loading on DOMContentLoaded
document.addEventListener('DOMContentLoaded', loadIncludes);

