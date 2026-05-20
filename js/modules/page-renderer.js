// MrGardenr CMS Page-Renderer Module
// Dynamically populates custom landing page copy & sections from the database

export function renderCategoryPage(pageData) {
  if (!pageData) return;

  // 1. Hero Section
  const heroSection = document.getElementById('heroSection');
  if (heroSection && pageData.heroBgImage) {
    heroSection.style.backgroundImage = `url('${pageData.heroBgImage}')`;
  }
  
  const heroTag = document.getElementById('heroTag');
  if (heroTag && pageData.heroTag) {
    heroTag.textContent = pageData.heroTag;
  }
  
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle && pageData.heroTitle) {
    heroTitle.textContent = pageData.heroTitle;
  }
  
  const heroDesc = document.getElementById('heroDesc');
  if (heroDesc && pageData.heroDesc) {
    heroDesc.textContent = pageData.heroDesc;
  }
  
  const heroCtaText = document.getElementById('heroCtaText');
  if (heroCtaText && pageData.heroCtaText) {
    heroCtaText.textContent = pageData.heroCtaText;
  }

  // 2. Intro Section
  const introTitle = document.getElementById('introTitle');
  if (introTitle && pageData.introTitle) {
    introTitle.textContent = pageData.introTitle;
  }
  
  const introP1 = document.getElementById('introP1');
  if (introP1 && pageData.introP1) {
    introP1.textContent = pageData.introP1;
  }
  
  const introP2 = document.getElementById('introP2');
  if (introP2 && pageData.introP2) {
    introP2.textContent = pageData.introP2;
  }
  
  const introP3 = document.getElementById('introP3');
  if (introP3 && pageData.introP3) {
    introP3.textContent = pageData.introP3;
  }
  
  const introImage = document.getElementById('introImage');
  if (introImage && pageData.introImage) {
    introImage.src = pageData.introImage;
  }

  // 3. Features Section
  const featuresTag = document.getElementById('featuresTag');
  if (featuresTag && pageData.featuresTag) {
    featuresTag.textContent = pageData.featuresTag;
  }
  
  const featuresTitle = document.getElementById('featuresTitle');
  if (featuresTitle && pageData.featuresTitle) {
    featuresTitle.textContent = pageData.featuresTitle;
  }
  
  const featuresDesc = document.getElementById('featuresDesc');
  if (featuresDesc && pageData.featuresDesc) {
    featuresDesc.textContent = pageData.featuresDesc;
  }

  // Card 1
  const feature1Icon = document.getElementById('feature1Icon');
  if (feature1Icon && pageData.feature1Icon) {
    feature1Icon.className = pageData.feature1Icon;
  }
  const feature1Title = document.getElementById('feature1Title');
  if (feature1Title && pageData.feature1Title) {
    feature1Title.textContent = pageData.feature1Title;
  }
  const feature1Desc = document.getElementById('feature1Desc');
  if (feature1Desc && pageData.feature1Desc) {
    feature1Desc.textContent = pageData.feature1Desc;
  }

  // Card 2
  const feature2Icon = document.getElementById('feature2Icon');
  if (feature2Icon && pageData.feature2Icon) {
    feature2Icon.className = pageData.feature2Icon;
  }
  const feature2Title = document.getElementById('feature2Title');
  if (feature2Title && pageData.feature2Title) {
    feature2Title.textContent = pageData.feature2Title;
  }
  const feature2Desc = document.getElementById('feature2Desc');
  if (feature2Desc && pageData.feature2Desc) {
    feature2Desc.textContent = pageData.feature2Desc;
  }

  // Card 3
  const feature3Icon = document.getElementById('feature3Icon');
  if (feature3Icon && pageData.feature3Icon) {
    feature3Icon.className = pageData.feature3Icon;
  }
  const feature3Title = document.getElementById('feature3Title');
  if (feature3Title && pageData.feature3Title) {
    feature3Title.textContent = pageData.feature3Title;
  }
  const feature3Desc = document.getElementById('feature3Desc');
  if (feature3Desc && pageData.feature3Desc) {
    feature3Desc.textContent = pageData.feature3Desc;
  }

  // 4. CTA Bar
  const ctaTitle = document.getElementById('ctaTitle');
  if (ctaTitle && pageData.ctaTitle) {
    ctaTitle.textContent = pageData.ctaTitle;
  }
  
  const ctaDesc = document.getElementById('ctaDesc');
  if (ctaDesc && pageData.ctaDesc) {
    ctaDesc.textContent = pageData.ctaDesc;
  }
  
  const ctaButtonText = document.getElementById('ctaButtonText');
  if (ctaButtonText && pageData.ctaButtonText) {
    ctaButtonText.textContent = pageData.ctaButtonText;
  }
}
