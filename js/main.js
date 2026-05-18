import { toggleMobileNav } from './modules/mobile-nav.js';
import { revealOnScroll } from './modules/scroll-reveal.js';
import { animateCounters } from './modules/counter-animation.js';
import { initTestimonialSlider } from './modules/testimonial-slider.js';
import { handleNavScroll } from './modules/navbar-scroll.js';
import { handleSubmit } from './modules/contact-form.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initStoreLocator } from './modules/store-locator.js';
import { initMagneticButtons } from './modules/magnetic-buttons.js';

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
  
  // Slider
  initTestimonialSlider();

  // Store Locator
  initStoreLocator();

  // Magnetic Buttons
  initMagneticButtons();
}

// Start loading on DOMContentLoaded
document.addEventListener('DOMContentLoaded', loadIncludes);
