export function renderGallery(gallery) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  gallery.forEach(item => {
    const el = document.createElement('div');
    el.className = 'gallery-item';
    el.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="gallery-item-overlay">
        <h4>${item.title}</h4>
        <p>${item.location}</p>
      </div>
    `;
    grid.appendChild(el);
  });
}

export function renderPageShowcase(gallery, category) {
  const grid = document.getElementById('showcaseGrid');
  if (!grid) return;
  
  const filtered = gallery.filter(item => item.category === category);
  if (filtered.length === 0) return; // Fallback to HTML placeholders if no database items yet
  
  grid.innerHTML = '';
  filtered.forEach(item => {
    const el = document.createElement('div');
    el.className = 'showcase-item reveal active';
    el.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="showcase-overlay">
        <h4>${item.title}</h4>
        <p>${item.location}</p>
      </div>
    `;
    grid.appendChild(el);
  });
}

