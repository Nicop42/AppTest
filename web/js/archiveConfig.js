// ✨ ARCHIVE IMAGE CONFIGURATION ✨
// Museum archive images (stills from Cabiria, 1914) that visitors can pick as the
// reference image for image-to-image generation.
// Edit the values below and the carousel updates automatically on page reload.

/**
 * ARCHIVE IMAGES
 *
 * HOW TO USE:
 * 1. image: The filename of the image in the /images/archive/ folder (e.g., "wedding.png")
 * 2. name: The caption shown under the image
 * 3. order: The position in the carousel (1 = first, 2 = second, etc.)
 *
 * TIPS:
 * - Keep filenames consistent with what you have in /images/archive/
 * - Captions should describe the scene or subject
 * - You can reorder images by changing the order numbers
 * - You can add new images by adding new entries here
 */

export const ARCHIVE_IMAGES = {
  castleAssault: {
    image: "castle-assault.png",
    name: "Assalto al castello",
    order: 9
  },

  molochTemple: {
    image: "moloch-temple.png",
    name: "Tempio del Moloch",
    order: 2
  },

  exoticEntrance: {
    image: "exotic-entrance.png",
    name: "Entrata esotica",
    order: 4
  },

  houseOfBattus: {
    image: "house-of-battus.png",
    name: "Casa di Batto",
    order: 5
  },

  sophonisba: {
    image: "sophonisba.png",
    name: "Sofonisba",
    order: 6
  },

  molochEntrance: {
    image: "moloch-entrance.png",
    name: "Entrata del Moloch",
    order: 7
  },

  wedding: {
    image: "wedding.png",
    name: "Matrimonio",
    order: 1
  },

  maciste: {
    image: "maciste.png",
    name: "Maciste",
    order: 3
  },

  archimedes: {
    image: "archimedes.png",
    name: "Archimede",
    order: 8
  },

  romanGeneral: {
    image: "roman-general.png",
    name: "Generale Romano",
    order: 10
  }
};

/**
 * QUICK REFERENCE:
 *
 * To change an image: Update the "image" field with your new filename
 * To change the caption: Update the "name" field
 * To reorder images: Change the "order" number (1 = first, 2 = second, etc.)
 *
 * TO ADD A NEW IMAGE:
 * Copy the file into /images/archive/ and add a new entry like this:
 *
 * newScene: {
 *   image: "new-scene.png",
 *   name: "New Scene Caption",
 *   order: 11
 * }
 *
 * The carousel will automatically update when you reload the page!
 */

/**
 * Returns the archive images sorted by their carousel order
 */
export function getSortedArchiveImages() {
  return Object.values(ARCHIVE_IMAGES)
    .sort((a, b) => a.order - b.order);
}
