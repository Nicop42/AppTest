// ✨ EASY ARCHIVIO IMAGE CONFIGURATION SCRIPT ✨
// This file makes it super easy to manage your archivio (museum) images!
// Just edit the values below and the images and names will automatically update.

/**
 * ARCHIVIO CONFIGURATION
 * 
 * HOW TO USE:
 * 1. image: The filename of the image in the /images/ folder (e.g., "archivio1.jpg")
 * 2. name: The name that will appear under the image
 * 3. order: The order in which the image appears (1 = first, 2 = second, etc.)
 * 
 * TIPS:
 * - Keep image names consistent with what you have in your /images/ folder
 * - Names should be descriptive of the artwork or style
 * - You can reorder images by changing the order numbers
 * - You can add new images by adding new entries here
 */

export const ARCHIVIO_CONFIG = {
  archivio1: {
    image: "archivio1.jpg",
    name: "Donna in biblioteca",
    order: 9
  },
  
  archivio2: {
    image: "archivio2.jpg", 
    name: "Barche sulla spiaggia",
    order: 2
  },
  
  archivio3: {
    image: "archivio3.jpg",
    name: "Entrata di un palazzo",
    order: 4
  },
  
  archivio4: {
    image: "archivio4.jpg",
    name: "Sguardo all'orizzonte", 
    order: 5
  },
  
  archivio5: {
    image: "archivio5.jpg",
    name: "Cortile interno",
    order: 6
  },
  
  archivio6: {
    image: "archivio6.jpg",
    name: "Skyline",
    order: 7
  },
  
  archivio7: {
    image: "archivio7.jpg",
    name: "Primo piano",
    order: 1
  },
  
  archivio8: {
    image: "archivio8.jpg",
    name: "Occhi", 
    order: 3
  },
  
  archivio9: {
    image: "archivio9.jpg",
    name: "Cafè",
    order: 8
  },
  
  archivio10: {
    image: "archivio10.jpg",
    name: "Dune di Sabbia",
    order: 10
  }
};

/**
 * QUICK REFERENCE:
 * 
 * To change an image: Update the "image" field with your new filename
 * To change the name under the image: Update the "name" field  
 * To reorder images: Change the "order" number (1 = first, 2 = second, etc.)
 * 
 * EXAMPLE - To change archivio1 to use a different image and name:
 * 
 * archivio1: {
 *   image: "my_new_museum_image.jpg",  // ← Change this
 *   name: "My New Artwork Name",       // ← Change this  
 *   order: 1                          // ← Change this to reorder
 * }
 * 
 * TO ADD A NEW IMAGE:
 * Just add a new entry like this:
 * 
 * archivio11: {
 *   image: "new_image.jpg",
 *   name: "New Artwork Name", 
 *   order: 11
 * }
 * 
 * The carousel will automatically update when you reload the page!
 */

/**
 * Helper function to get archivio images sorted by order
 */
export function getArchivioImagesSorted() {
  return Object.values(ARCHIVIO_CONFIG)
    .sort((a, b) => a.order - b.order);
}
