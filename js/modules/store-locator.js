export function initStoreLocator() {
  const tabs = document.querySelectorAll('.locator-tab');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    // avoid multiple bindings
    const newTab = tab.cloneNode(true);
    tab.parentNode.replaceChild(newTab, tab);
    
    newTab.addEventListener('click', () => {
      const city = newTab.dataset.city;

      // Update active tab
      document.querySelectorAll('.locator-tab').forEach(t => t.classList.remove('active'));
      newTab.classList.add('active');

      // Update active card
      document.querySelectorAll('.locator-card').forEach(card => {
        card.classList.remove('active');
      });
      const target = document.getElementById('loc-' + city);
      if (target) target.classList.add('active');
    });
  });
}
