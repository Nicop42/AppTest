// ✨ ARCHIVE CAROUSEL ✨
// Builds the museum archive carousel (inside the reference image modal) from archiveConfig.js

import { getSortedArchiveImages } from './archiveConfig.js';

// Swiper instance, kept so it can be destroyed/re-created and accessed by other modules
let archiveSwiper = null;

/**
 * Build the slides HTML for the archive carousel
 */
export function buildArchiveSlidesHTML() {
  try {
    const archiveImages = getSortedArchiveImages();
    console.log('🖼️ Generating archive carousel with images:', archiveImages);

    let slidesHTML = '';

    archiveImages.forEach((imageConfig, index) => {
      console.log(`🖼️ Adding image ${index + 1}:`, imageConfig.name);
      slidesHTML += `
        <div class="swiper-slide">
          <button type="button" class="archive-image-btn">
            <img
              src="images/archive/${imageConfig.image}"
              width="200"
              height="200"
              alt="${imageConfig.name}"
            />
            <span class="thumbnail-label">${imageConfig.name}</span>
          </button>
        </div>`;
    });

    console.log('✅ Generated HTML for archive carousel');
    return slidesHTML;
  } catch (error) {
    console.error('❌ Error generating archive carousel:', error);
    return '';
  }
}

/**
 * Initialize the Swiper instance for the archive carousel
 */
function initializeArchiveSwiper() {
  try {
    // Check if Swiper is available
    if (typeof Swiper === 'undefined') {
      console.error('❌ Swiper library not loaded');
      return;
    }

    // Destroy existing instance if it exists
    if (archiveSwiper) {
      archiveSwiper.destroy(true, true);
    }

    archiveSwiper = new Swiper('.archive-swiper', {
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

    console.log('✅ Archive Swiper initialized successfully');
    return archiveSwiper;
  } catch (error) {
    console.error('❌ Error initializing archive swiper:', error);
  }
}

/**
 * Get the current Swiper instance
 */
export function getArchiveSwiper() {
  return archiveSwiper;
}

/**
 * Initialize the archive carousel
 * Call this function after the DOM is loaded
 */
export function initializeArchiveCarousel() {
  try {
    console.log('🚀 Initializing archive carousel...');

    const swiperWrapper = document.querySelector('.archive-swiper .swiper-wrapper');

    if (!swiperWrapper) {
      console.error('❌ Could not find swiper wrapper for archive carousel');
      return;
    }

    // Generate and insert the slides
    const slidesHTML = buildArchiveSlidesHTML();
    if (slidesHTML) {
      swiperWrapper.innerHTML = slidesHTML;
      console.log('✅ Archive slides inserted into DOM');

      // Initialize the Swiper after a short delay to ensure DOM is updated
      setTimeout(() => {
        initializeArchiveSwiper();
      }, 100);

    } else {
      console.error('❌ No carousel HTML generated');
    }

  } catch (error) {
    console.error('❌ Error initializing archive carousel:', error);
  }
}
