// MrGardenr Admin CMS Control Module

// Global Session Fetch Interceptor (handles session timeouts/401 Unauthorized)
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  try {
    const response = await originalFetch(...args);
    if (response.status === 401) {
      // Force redirect to login page immediately
      window.location.replace('/login.html');
      return new Promise(() => {}); // Halts any downstream then() blocks
    }
    return response;
  } catch (err) {
    throw err;
  }
};

// Global State
let contentData = {
  testimonials: [],
  gallery: []
};
let currentCategory = 'home-landscaping';

// DOM Elements
const tabButtons = document.querySelectorAll('.menu-item');
const tabPanes = document.querySelectorAll('.tab-pane');
const headerTitle = document.querySelector('.header-title h1');

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSubTabs();
  initAccordions();
  fetchContent();
  initGalleryUpload();
  initGalleryForm();
  initTestimonialForm();
  initPageEditorUploaders();
  initPageEditorForm();
  initMediaUploader();
  initDeploySystem();
  initLogout();
});

// TABS CONTROLLER
function initTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Update active button
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active tab pane
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      let paneId = 'tabCategory';
      if (tabId === 'media') paneId = 'tabMedia';
      if (tabId === 'deploy') paneId = 'tabDeploy';
      
      if (tabId === 'category') {
        currentCategory = btn.getAttribute('data-category');
        renderCategoryContent();
      }
      
      const activePane = document.getElementById(paneId);
      if (activePane) activePane.classList.add('active');
      
      // Update page title
      headerTitle.textContent = btn.querySelector('span').textContent;
    });
  });
}

// FETCH SYSTEM
async function fetchContent() {
  try {
    const response = await fetch('/api/content');
    if (!response.ok) throw new Error('Failed to load database content.');
    contentData = await response.json();
    
    updateStats();
    renderCategoryContent();
  } catch (err) {
    showToast('Error loading CMS content: ' + err.message, 'error');
  }
}

function updateStats() {
  document.getElementById('statGalleryCount').textContent = contentData.gallery.length;
  document.getElementById('statTestimonialCount').textContent = contentData.testimonials.length;
}

// RENDER UNIFIED CATEGORY CONTENT
function renderCategoryContent() {
  const categoryTitle = currentCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  // Update UI headings
  document.getElementById('projectFormTitle').textContent = `Add ${categoryTitle} Project`;
  document.getElementById('projectFormDesc').textContent = `Add a beautiful landscape project to the ${categoryTitle} showcase.`;
  document.getElementById('projectListTitle').textContent = `Category Projects: ${categoryTitle}`;
  
  document.getElementById('testimonialFormTitle').textContent = `Add ${categoryTitle} Review`;
  document.getElementById('testimonialFormDesc').textContent = `Insert client reviews specifically for ${categoryTitle}.`;
  document.getElementById('testimonialListTitle').textContent = `Active Reviews: ${categoryTitle}`;
  
  // Sync hidden form inputs
  document.getElementById('galleryCategory').value = currentCategory;
  document.getElementById('testimonialCategory').value = currentCategory;
  
  // Cancel active edits to prevent cross-category state leaks
  document.getElementById('clearGalleryFormBtn').click();
  document.getElementById('clearTestimonialFormBtn').click();
  
  // Render lists & editor
  renderGalleryList();
  renderTestimonialsList();
  populatePageEditor();
}

// TOAST NOTIFICATIONS
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-circle-check text-success';
  if (type === 'error') iconClass = 'fa-circle-exclamation text-error';
  if (type === 'warning') iconClass = 'fa-triangle-exclamation text-warning';
  
  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Remove toast after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// GALLERY UPLOADS
function initGalleryUpload() {
  const uploadArea = document.getElementById('galleryUploadArea');
  const fileInput = document.getElementById('galleryFileInput');
  const preview = document.getElementById('galleryPreview');
  const imagePathInput = document.getElementById('galleryImagePath');
  
  if (!uploadArea) return;
  
  uploadArea.addEventListener('click', () => fileInput.click());
  
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary)';
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--gray-light)';
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--gray-light)';
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });
  
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileUpload(fileInput.files[0]);
    }
  });
  
  async function handleFileUpload(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file.', 'error');
      return;
    }
    
    showToast('Uploading image...', 'warning');
    
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file
      });
      
      const result = await response.json();
      if (result.success) {
        imagePathInput.value = result.url;
        preview.src = result.url;
        preview.classList.remove('hidden');
        showToast('Image uploaded successfully!');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      showToast('Upload error: ' + err.message, 'error');
    }
  }
}

// GALLERY CRUD OPERATIONS
function initGalleryForm() {
  const form = document.getElementById('galleryForm');
  const idInput = document.getElementById('galleryId');
  const titleInput = document.getElementById('galleryTitle');
  const locationInput = document.getElementById('galleryLocation');
  const categoryInput = document.getElementById('galleryCategory');
  const imagePathInput = document.getElementById('galleryImagePath');
  const preview = document.getElementById('galleryPreview');
  const clearBtn = document.getElementById('clearGalleryFormBtn');
  
  if (!form) return;
  
  clearBtn.addEventListener('click', () => {
    form.reset();
    idInput.value = '';
    imagePathInput.value = '';
    categoryInput.value = currentCategory;
    preview.classList.add('hidden');
    clearBtn.classList.add('hidden');
    form.querySelector('button[type="submit"]').innerHTML = '<i class="fa-solid fa-plus"></i> Save Project';
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = idInput.value;
    const title = titleInput.value;
    const location = locationInput.value;
    const category = categoryInput.value || currentCategory;
    const image = imagePathInput.value;
    
    if (!image) {
      showToast('Please upload a project photo.', 'error');
      return;
    }
    
    if (id) {
      // Edit mode
      const index = contentData.gallery.findIndex(item => item.id === id);
      if (index !== -1) {
        contentData.gallery[index] = { id, title, location, category, image };
        showToast('Project updated successfully.');
      }
    } else {
      // Add mode
      const newId = 'g' + Date.now();
      contentData.gallery.push({ id: newId, title, location, category, image });
      showToast('Project added successfully.');
    }
    
    await saveContent();
    clearBtn.click(); // Reset form
  });
}

async function saveContent() {
  try {
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentData)
    });
    
    if (!response.ok) throw new Error('Failed to save content state to database.');
    
    updateStats();
    renderCategoryContent();
  } catch (err) {
    showToast('Error saving data: ' + err.message, 'error');
  }
}

function renderGalleryList() {
  const container = document.getElementById('galleryListGrid');
  if (!container) return;
  container.innerHTML = '';
  
  const filtered = contentData.gallery.filter(item => item.category === currentCategory);
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-list-placeholder">
        <i class="fa-solid fa-folder-open"></i>
        <p>No projects in this category yet. Add one above!</p>
      </div>
    `;
    return;
  }
  
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'portfolio-admin-card';
    card.innerHTML = `
      <div class="portfolio-admin-thumb">
        <img src="${item.image}" alt="${item.title}">
      </div>
      <div class="portfolio-admin-details">
        <h4>${item.title}</h4>
        <p>${item.location}</p>
      </div>
      <div class="portfolio-admin-actions">
        <button class="btn-edit" data-id="${item.id}"><i class="fa-solid fa-pencil"></i> Edit</button>
        <button class="btn-delete" data-id="${item.id}"><i class="fa-solid fa-trash-can"></i> Delete</button>
      </div>
    `;
    
    card.querySelector('.btn-edit').addEventListener('click', () => editGalleryItem(item));
    card.querySelector('.btn-delete').addEventListener('click', () => deleteGalleryItem(item.id));
    
    container.appendChild(card);
  });
}

function editGalleryItem(item) {
  const form = document.getElementById('galleryForm');
  document.getElementById('galleryId').value = item.id;
  document.getElementById('galleryTitle').value = item.title;
  document.getElementById('galleryLocation').value = item.location;
  document.getElementById('galleryCategory').value = item.category || currentCategory;
  document.getElementById('galleryImagePath').value = item.image;
  
  const preview = document.getElementById('galleryPreview');
  preview.src = item.image;
  preview.classList.remove('hidden');
  
  document.getElementById('clearGalleryFormBtn').classList.remove('hidden');
  form.querySelector('button[type="submit"]').innerHTML = '<i class="fa-solid fa-check"></i> Update Project';
  
  form.scrollIntoView({ behavior: 'smooth' });
}

async function deleteGalleryItem(id) {
  if (!confirm('Are you sure you want to delete this gallery project?')) return;
  
  contentData.gallery = contentData.gallery.filter(item => item.id !== id);
  showToast('Project deleted.');
  await saveContent();
}

// TESTIMONIAL CRUD OPERATIONS
function initTestimonialForm() {
  const form = document.getElementById('testimonialForm');
  const idInput = document.getElementById('testimonialId');
  const categoryInput = document.getElementById('testimonialCategory');
  const authorInput = document.getElementById('testimonialAuthor');
  const roleInput = document.getElementById('testimonialRole');
  const quoteInput = document.getElementById('testimonialQuote');
  const clearBtn = document.getElementById('clearTestimonialFormBtn');
  
  if (!form) return;
  
  clearBtn.addEventListener('click', () => {
    form.reset();
    idInput.value = '';
    categoryInput.value = currentCategory;
    clearBtn.classList.add('hidden');
    form.querySelector('button[type="submit"]').innerHTML = '<i class="fa-solid fa-plus"></i> Save Testimonial';
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = idInput.value;
    const author = authorInput.value;
    const role = roleInput.value;
    const quote = quoteInput.value;
    const category = categoryInput.value || currentCategory;
    
    if (id) {
      // Edit
      const index = contentData.testimonials.findIndex(item => item.id === id);
      if (index !== -1) {
        contentData.testimonials[index] = { id, author, role, quote, category };
        showToast('Testimonial updated.');
      }
    } else {
      // Add
      const newId = 't' + Date.now();
      contentData.testimonials.push({ id: newId, author, role, quote, category });
      showToast('Testimonial added.');
    }
    
    await saveContent();
    clearBtn.click();
  });
}

function renderTestimonialsList() {
  const container = document.getElementById('testimonialsListContainer');
  if (!container) return;
  container.innerHTML = '';
  
  const filtered = contentData.testimonials.filter(t => t.category === currentCategory);
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-list-placeholder">
        <i class="fa-solid fa-comment-slash"></i>
        <p>No testimonials in this category yet. Add one above!</p>
      </div>
    `;
    return;
  }
  
  filtered.forEach(t => {
    const card = document.createElement('div');
    card.className = 'testimonial-admin-card';
    card.innerHTML = `
      <div class="testimonial-admin-content">
        <p class="testimonial-admin-quote">&ldquo;${t.quote}&rdquo;</p>
        <div class="testimonial-admin-meta">
          <strong>${t.author}</strong>
          <span>${t.role}</span>
        </div>
      </div>
      <div class="testimonial-admin-actions">
        <button class="btn-edit" data-id="${t.id}"><i class="fa-solid fa-pencil"></i></button>
        <button class="btn-delete" data-id="${t.id}"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `;
    
    card.querySelector('.btn-edit').addEventListener('click', () => editTestimonialItem(t));
    card.querySelector('.btn-delete').addEventListener('click', () => deleteTestimonialItem(t.id));
    
    container.appendChild(card);
  });
}

function editTestimonialItem(t) {
  const form = document.getElementById('testimonialForm');
  document.getElementById('testimonialId').value = t.id;
  document.getElementById('testimonialCategory').value = t.category || currentCategory;
  document.getElementById('testimonialAuthor').value = t.author;
  document.getElementById('testimonialRole').value = t.role;
  document.getElementById('testimonialQuote').value = t.quote;
  
  document.getElementById('clearTestimonialFormBtn').classList.remove('hidden');
  form.querySelector('button[type="submit"]').innerHTML = '<i class="fa-solid fa-check"></i> Update Testimonial';
  
  form.scrollIntoView({ behavior: 'smooth' });
}

async function deleteTestimonialItem(id) {
  if (!confirm('Are you sure you want to remove this client review?')) return;
  
  contentData.testimonials = contentData.testimonials.filter(t => t.id !== id);
  showToast('Testimonial removed.');
  await saveContent();
}

// MEDIA BRAND REPLACER
function initMediaUploader() {
  const uploaders = document.querySelectorAll('.core-media-uploader');
  
  uploaders.forEach(uploader => {
    uploader.addEventListener('change', async () => {
      if (uploader.files.length === 0) return;
      const file = uploader.files[0];
      const targetFilename = uploader.getAttribute('data-target');
      
      showToast(`Uploading brand replacement: ${targetFilename}...`, 'warning');
      
      try {
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          body: file
        });
        
        const result = await response.json();
        if (result.success) {
          showToast(`Successfully replaced brand image: ${targetFilename}`);
          
          // Refresh preview thumbnail with cache buster
          const previewImg = uploader.closest('.media-card').querySelector('.media-preview-container img');
          if (previewImg) {
            previewImg.src = `images/${targetFilename}?cb=${Date.now()}`;
          }
        } else {
          throw new Error(result.error || 'Replacement upload failed');
        }
      } catch (err) {
        showToast('Replacement error: ' + err.message, 'error');
      }
    });
  });
}

// DEPLOY / GIT PIPELINE SYSTEM
function initDeploySystem() {
  const fullDeployBtn = document.getElementById('fullDeployBtn');
  const quickGitBtn = document.getElementById('quickGitBtn');
  const deployConsole = document.getElementById('deployConsole');
  const consoleOutput = document.getElementById('consoleOutput');
  
  if (!fullDeployBtn) return;
  
  fullDeployBtn.addEventListener('click', () => triggerGitPush(fullDeployBtn));
  quickGitBtn.addEventListener('click', () => triggerGitPush(quickGitBtn));
  
  async function triggerGitPush(activeButton) {
    // Disable buttons
    fullDeployBtn.disabled = true;
    quickGitBtn.disabled = true;
    
    // Show spinner
    fullDeployBtn.querySelector('.btn-spinner').classList.remove('hidden');
    fullDeployBtn.querySelector('.btn-icon').classList.add('hidden');
    quickGitBtn.querySelector('.btn-spinner').classList.remove('hidden');
    quickGitBtn.querySelector('.btn-icon').classList.add('hidden');
    
    deployConsole.classList.remove('hidden');
    consoleOutput.textContent = '>> Starting Git deployment sync pipeline...\n';
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    
    setTimeout(() => {
      consoleOutput.textContent += '>> Scanning for modified files and database records...\n';
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }, 800);
    
    setTimeout(async () => {
      try {
        consoleOutput.textContent += '>> Executing background Git commands on server...\n';
        consoleOutput.textContent += '>> git add .\n';
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
        
        const response = await fetch('/api/git-push', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
          consoleOutput.textContent += '>> git commit -m "CMS Update: ..."\n';
          consoleOutput.textContent += '>> git push origin main\n';
          consoleOutput.textContent += `>> Server Output: ${result.message}\n`;
          consoleOutput.textContent += '>> DEPLOYMENT SUCCESSFUL! 🎉 Live site is now syncing on GitHub Pages.';
          consoleOutput.scrollTop = consoleOutput.scrollHeight;
          showToast('Live site successfully published to GitHub!');
        } else {
          throw new Error(result.error || 'Server git error');
        }
      } catch (err) {
        consoleOutput.textContent += `>> ERROR: ${err.message}\n`;
        consoleOutput.textContent += '>> DEPLOYMENT FAILED. Please check repository remote configuration.';
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
        showToast('Deployment sync failed.', 'error');
      } finally {
        // Re-enable
        fullDeployBtn.disabled = false;
        quickGitBtn.disabled = false;
        fullDeployBtn.querySelector('.btn-spinner').classList.add('hidden');
        fullDeployBtn.querySelector('.btn-icon').classList.remove('hidden');
        quickGitBtn.querySelector('.btn-spinner').classList.add('hidden');
        quickGitBtn.querySelector('.btn-icon').classList.remove('hidden');
      }
    }, 1800);
  }
}

// SUB-TABS MANAGEMENT
let currentSubTab = 'projects';

function initSubTabs() {
  const subTabButtons = document.querySelectorAll('.sub-tab-btn');
  const subTabPanes = document.querySelectorAll('.sub-tab-pane');
  
  subTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const subtab = btn.getAttribute('data-subtab');
      currentSubTab = subtab;
      
      // Update button selection states
      subTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Hide all panes
      subTabPanes.forEach(pane => {
        pane.classList.remove('active');
        pane.classList.add('hidden');
      });
      
      // Show matching subtab pane
      let targetPaneId = 'subTabProjects';
      if (subtab === 'testimonials') targetPaneId = 'subTabTestimonials';
      if (subtab === 'editor') targetPaneId = 'subTabPageEditor';
      
      const targetPane = document.getElementById(targetPaneId);
      if (targetPane) {
        targetPane.classList.add('active');
        targetPane.classList.remove('hidden');
      }
    });
  });
}

// ACCORDION LAYOUT CONTROLLER
function initAccordions() {
  const cards = document.querySelectorAll('.accordion-card');
  cards.forEach((card, index) => {
    const header = card.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isActive = card.classList.contains('active');
      
      // Toggle current accordion
      if (isActive) {
        card.classList.remove('active');
      } else {
        // Close others
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      }
    });
    
    // Expand the Hero accordion by default
    if (index === 0) {
      card.classList.add('active');
    }
  });
}

// POPULATE PAGE SECTIONS FIELDS FROM DATABASE
function populatePageEditor() {
  if (!contentData.pages || !contentData.pages[currentCategory]) {
    return;
  }
  
  const page = contentData.pages[currentCategory];
  
  // Hero
  document.getElementById('pageHeroTag').value = page.heroTag || '';
  document.getElementById('pageHeroTitle').value = page.heroTitle || '';
  document.getElementById('pageHeroDesc').value = page.heroDesc || '';
  document.getElementById('pageHeroCtaText').value = page.heroCtaText || '';
  document.getElementById('pageHeroBgImagePath').value = page.heroBgImage || '';
  
  const heroPreview = document.getElementById('pageHeroBgPreview');
  if (page.heroBgImage) {
    heroPreview.src = page.heroBgImage;
    heroPreview.classList.remove('hidden');
  } else {
    heroPreview.classList.add('hidden');
  }
  
  // Intro
  document.getElementById('pageIntroTitle').value = page.introTitle || '';
  document.getElementById('pageIntroP1').value = page.introP1 || '';
  document.getElementById('pageIntroP2').value = page.introP2 || '';
  document.getElementById('pageIntroP3').value = page.introP3 || '';
  document.getElementById('pageIntroImagePath').value = page.introImage || '';
  
  const introPreview = document.getElementById('pageIntroPreview');
  if (page.introImage) {
    introPreview.src = page.introImage;
    introPreview.classList.remove('hidden');
  } else {
    introPreview.classList.add('hidden');
  }
  
  // Features Header
  document.getElementById('pageFeaturesTag').value = page.featuresTag || '';
  document.getElementById('pageFeaturesTitle').value = page.featuresTitle || '';
  document.getElementById('pageFeaturesDesc').value = page.featuresDesc || '';
  
  // Features Cards
  document.getElementById('pageFeature1Icon').value = page.feature1Icon || '';
  document.getElementById('pageFeature1Title').value = page.feature1Title || '';
  document.getElementById('pageFeature1Desc').value = page.feature1Desc || '';
  
  document.getElementById('pageFeature2Icon').value = page.feature2Icon || '';
  document.getElementById('pageFeature2Title').value = page.feature2Title || '';
  document.getElementById('pageFeature2Desc').value = page.feature2Desc || '';
  
  document.getElementById('pageFeature3Icon').value = page.feature3Icon || '';
  document.getElementById('pageFeature3Title').value = page.feature3Title || '';
  document.getElementById('pageFeature3Desc').value = page.feature3Desc || '';
  
  // CTA Banner
  document.getElementById('pageCtaTitle').value = page.ctaTitle || '';
  document.getElementById('pageCtaDesc').value = page.ctaDesc || '';
  document.getElementById('pageCtaButtonText').value = page.ctaButtonText || '';
}

// UPLOADER LOGIC FOR PAGE GRAPHICS
function initPageEditorUploaders() {
  setupUploader('pageHeroBgUploadArea', 'pageHeroBgFileInput', 'pageHeroBgPreview', 'pageHeroBgImagePath');
  setupUploader('pageIntroUploadArea', 'pageIntroFileInput', 'pageIntroPreview', 'pageIntroImagePath');
  
  function setupUploader(areaId, inputId, previewId, pathId) {
    const uploadArea = document.getElementById(areaId);
    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const imagePathInput = document.getElementById(pathId);
    
    if (!uploadArea) return;
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--primary)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = 'var(--gray-light)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--gray-light)';
      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files[0]);
      }
    });
    
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        handleUpload(fileInput.files[0]);
      }
    });
    
    async function handleUpload(file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file.', 'error');
        return;
      }
      
      showToast('Uploading image...', 'warning');
      
      try {
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          body: file
        });
        
        const result = await response.json();
        if (result.success) {
          imagePathInput.value = result.url;
          preview.src = result.url;
          preview.classList.remove('hidden');
          showToast('Image uploaded successfully!');
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (err) {
        showToast('Upload error: ' + err.message, 'error');
      }
    }
  }
}

// SAVE DYNAMIC SECTION CONTENTS
function initPageEditorForm() {
  const form = document.getElementById('pageEditorForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!contentData.pages) {
      contentData.pages = {};
    }
    
    contentData.pages[currentCategory] = {
      heroTag: document.getElementById('pageHeroTag').value,
      heroTitle: document.getElementById('pageHeroTitle').value,
      heroDesc: document.getElementById('pageHeroDesc').value,
      heroCtaText: document.getElementById('pageHeroCtaText').value,
      heroBgImage: document.getElementById('pageHeroBgImagePath').value,
      introTitle: document.getElementById('pageIntroTitle').value,
      introP1: document.getElementById('pageIntroP1').value,
      introP2: document.getElementById('pageIntroP2').value,
      introP3: document.getElementById('pageIntroP3').value,
      introImage: document.getElementById('pageIntroImagePath').value,
      featuresTag: document.getElementById('pageFeaturesTag').value,
      featuresTitle: document.getElementById('pageFeaturesTitle').value,
      featuresDesc: document.getElementById('pageFeaturesDesc').value,
      feature1Icon: document.getElementById('pageFeature1Icon').value,
      feature1Title: document.getElementById('pageFeature1Title').value,
      feature1Desc: document.getElementById('pageFeature1Desc').value,
      feature2Icon: document.getElementById('pageFeature2Icon').value,
      feature2Title: document.getElementById('pageFeature2Title').value,
      feature2Desc: document.getElementById('pageFeature2Desc').value,
      feature3Icon: document.getElementById('pageFeature3Icon').value,
      feature3Title: document.getElementById('pageFeature3Title').value,
      feature3Desc: document.getElementById('pageFeature3Desc').value,
      ctaTitle: document.getElementById('pageCtaTitle').value,
      ctaDesc: document.getElementById('pageCtaDesc').value,
      ctaButtonText: document.getElementById('pageCtaButtonText').value
    };
    
    showToast('Saving page content update...', 'warning');
    await saveContent();
  });
}

function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/logout', { method: 'POST' });
        if (response.ok) {
          window.location.replace('/login.html');
        } else {
          window.location.replace('/login.html');
        }
      } catch (err) {
        window.location.replace('/login.html');
      }
    });
  }
}
