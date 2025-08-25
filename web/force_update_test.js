// 🚨 FORCE ARCHIVIO UPDATE TEST 🚨
// This script will force the archivio carousel to update with the correct names
// Run this script in the browser console to test

console.log("🚨 FORCE UPDATE: Starting archivio carousel force update...");

// Import the configuration
import('./js/archivioConfig.js').then(({ ARCHIVIO_CONFIG, getArchivioImagesSorted }) => {
  console.log("🚨 Configuration loaded:", ARCHIVIO_CONFIG);
  
  const sortedImages = getArchivioImagesSorted();
  console.log("🚨 Sorted images:", sortedImages);
  
  // Find the wrapper
  const wrapper = document.querySelector('.swiper-archivio .swiper-wrapper');
  if (!wrapper) {
    console.error("🚨 No swiper wrapper found!");
    return;
  }
  
  console.log("🚨 Found wrapper, current content:", wrapper.innerHTML.length, "characters");
  
  // Generate new HTML
  let html = '';
  sortedImages.forEach((img, index) => {
    console.log(`🚨 Processing image ${index + 1}: ${img.name}`);
    html += `
      <div class="swiper-slide">
        <button type="button" class="img-archivio-btn">
          <img src="images/${img.image}" width="200" height="200" alt="${img.name}" />
          <span class="nome-stile">${img.name}</span>
        </button>
      </div>`;
  });
  
  // Force insert the HTML
  wrapper.innerHTML = html;
  console.log("🚨 HTML inserted, new content length:", wrapper.innerHTML.length);
  
  // Re-initialize Swiper if needed
  if (typeof Swiper !== 'undefined') {
    setTimeout(() => {
      try {
        const swiper = new Swiper('.swiper-archivio', {
          slidesPerView: 'auto',
          spaceBetween: 10,
          pagination: { el: '.swiper-pagination', clickable: true }
        });
        console.log("🚨 Swiper re-initialized");
      } catch (e) {
        console.log("🚨 Swiper init error (might already exist):", e.message);
      }
    }, 100);
  }
  
}).catch(error => {
  console.error("🚨 Error in force update:", error);
});
