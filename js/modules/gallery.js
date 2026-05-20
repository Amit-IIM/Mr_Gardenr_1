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
