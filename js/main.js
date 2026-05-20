import { toggleMobileNav } from './modules/mobile-nav.js';
import { revealOnScroll } from './modules/scroll-reveal.js';
import { animateCounters } from './modules/counter-animation.js';
import { initTestimonialSlider, renderTestimonials } from './modules/testimonial-slider.js';
import { renderGallery, renderPageShowcase } from './modules/gallery.js';
import { handleNavScroll } from './modules/navbar-scroll.js';
import { handleSubmit } from './modules/contact-form.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initStoreLocator } from './modules/store-locator.js';
import { initMagneticButtons } from './modules/magnetic-buttons.js';
import { initAppointmentBooking } from './modules/appointment.js';
import { renderCategoryPage } from './modules/page-renderer.js';

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
      
      // Auto-detect page category
      let pageCategory = '';
      const path = window.location.pathname.toLowerCase();
      if (path.includes('home-landscaping')) pageCategory = 'home-landscaping';
      else if (path.includes('penthouse')) pageCategory = 'penthouse';
      else if (path.includes('commercial-landscaping')) pageCategory = 'commercial-landscaping';
      else if (path.includes('office-landscaping')) pageCategory = 'office-landscaping';

      // Dynamic category page rendering
      if (pageCategory && data.pages && data.pages[pageCategory]) {
        renderCategoryPage(data.pages[pageCategory]);
      }

      // Testimonial filtering and rendering
      if (data.testimonials && data.testimonials.length > 0) {
        let filteredTestimonials = data.testimonials;
        if (pageCategory) {
          const categorySpecific = data.testimonials.filter(t => t.category === pageCategory);
          if (categorySpecific.length > 0) {
            filteredTestimonials = categorySpecific;
          }
        }
        renderTestimonials(filteredTestimonials);
      } else {
        initTestimonialSlider();
      }

      // Gallery and page showcase rendering
      if (data.gallery && data.gallery.length > 0) {
        renderGallery(data.gallery);
        if (pageCategory) {
          renderPageShowcase(data.gallery, pageCategory);
        }
      }
    } else {
      console.warn("Dynamic database content.json not found, utilizing HTML static fallback");
      initTestimonialSlider();
      showCmsOfflineNotification();
    }
  } catch (err) {
    console.error("Error loading dynamic content:", err);
    initTestimonialSlider();
    showCmsOfflineNotification();
  }
}

function showCmsOfflineNotification() {
  if (document.getElementById('cmsOfflineBanner')) return;

  const banner = document.createElement('div');
  banner.id = 'cmsOfflineBanner';
  banner.className = 'offline-banner';
  
  banner.innerHTML = `
    <div class="offline-icon-container">
      <i class="fa-solid fa-wifi-slash"></i>
    </div>
    <div class="offline-content">
      <div class="offline-title">Offline Mode Enabled</div>
      <div class="offline-text">
        The live CMS database is currently unreachable. The site remains fully functional using local static backups.
      </div>
    </div>
    <button class="offline-close-btn" aria-label="Dismiss notification">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  document.body.appendChild(banner);

  setTimeout(() => {
    banner.classList.add('show');
  }, 100);

  const closeBtn = banner.querySelector('.offline-close-btn');
  closeBtn.addEventListener('click', () => {
    banner.classList.remove('show');
    setTimeout(() => {
      banner.remove();
    }, 600);
  });
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

