// ✨ ARCHIVIO CAROUSEL GENERATOR ✨
// This script automatically generates the archivio carousel from the configuration

import { getArchivioImagesSorted } from './archivioConfig.js';

// Store the swiper instance globally for access by other modules
let archivioSwiperInstance = null;

/**
 * Generate the archivio carousel HTML dynamically
 */
export function generateArchivioCarousel() {
  try {
    const archivioImages = getArchivioImagesSorted();
    console.log('🖼️ Generating archivio carousel with images:', archivioImages);
    
    let swiperSlidesHTML = '';
    
    archivioImages.forEach((imageConfig, index) => {
      console.log(`🖼️ Adding image ${index + 1}:`, imageConfig.name);
      swiperSlidesHTML += `
        <div class="swiper-slide">
          <button type="button" class="img-archivio-btn">
            <img
              src="images/${imageConfig.image}"
              width="200"
              height="200"
              alt="${imageConfig.name}"
            />
            <span class="nome-stile">${imageConfig.name}</span>
          </button>
        </div>`;
    });
    
    console.log('✅ Generated HTML for archivio carousel');
    return swiperSlidesHTML;
  } catch (error) {
    console.error('❌ Error generating archivio carousel:', error);
    return '';
  }
}

/**
 * Initialize the Swiper carousel for archivio
 */
function initializeArchivioSwiper() {
  try {
    // Check if Swiper is available
    if (typeof Swiper === 'undefined') {
      console.error('❌ Swiper library not loaded');
      return;
    }

    // Destroy existing instance if it exists
    if (archivioSwiperInstance) {
      archivioSwiperInstance.destroy(true, true);
    }

    // Initialize the swiper
    archivioSwiperInstance = new Swiper('.swiper-archivio', {
      slidesPerView: 'auto',
      spaceBetween: 10,
      centeredSlides: false,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        320: {
          slidesPerView: 1,
          spaceBetween: 10
        },
        640: {
          slidesPerView: 2,
          spaceBetween: 15
        },
        768: {
          slidesPerView: 3,
          spaceBetween: 15
        },
        1024: {
          slidesPerView: 4,
          spaceBetween: 20
        }
      }
    });
    
    console.log('✅ Archivio Swiper initialized successfully');
    return archivioSwiperInstance;
  } catch (error) {
    console.error('❌ Error initializing archivio swiper:', error);
  }
}

/**
 * Get the current swiper instance
 */
export function getArchivioSwiper() {
  return archivioSwiperInstance;
}

/**
 * Initialize the archivio carousel
 * Call this function after the DOM is loaded
 */
export function initializeArchivioCarousel() {
  try {
    console.log('🚀 Initializing archivio carousel...');
    
    const swiperWrapper = document.querySelector('.swiper-archivio .swiper-wrapper');
    
    if (!swiperWrapper) {
      console.error('❌ Could not find swiper wrapper for archivio carousel');
      return;
    }

    // Generate and insert the slides
    const carouselHTML = generateArchivioCarousel();
    if (carouselHTML) {
      swiperWrapper.innerHTML = carouselHTML;
      console.log('✅ Archivio slides inserted into DOM');
      
      // Initialize the Swiper after a short delay to ensure DOM is updated
      setTimeout(() => {
        initializeArchivioSwiper();
      }, 100);
      
    } else {
      console.error('❌ No carousel HTML generated');
    }
    
  } catch (error) {
    console.error('❌ Error initializing archivio carousel:', error);
  }
}
