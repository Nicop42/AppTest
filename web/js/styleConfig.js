// ✨ STYLE PRESET CONFIGURATION ✨
// Visual style presets the visitor can add to the prompt.
// Edit the values below and the UI will automatically update.

/**
 * STYLE LAYOUT
 * Defines which presets appear in the main section vs the "more styles" section
 */
export const STYLE_LAYOUT = {
  // Presets shown in the main visible section
  primaryStyles: [
    'almaTadema', 'silentFilm', 'orientalist', 'dramaticPoster',
    'cabiria', 'japaneseIllustration', 'romanArena', 'volcanicEruption'
  ],

  // Presets shown in the collapsible "more styles" section
  moreStyles: ['kandinsky', 'artNouveau', 'vector', 'popArt']
};

/**
 * Style Presets
 *
 * HOW TO USE:
 * 1. image: The filename of the thumbnail in the /images/styles/ folder (e.g., "alma-tadema.png")
 * 2. name: The label shown under the thumbnail
 * 3. positivePrompt: Text that gets added to the positive prompt when selected
 * 4. negativePrompt: (Optional) Text that gets added to the negative prompt when selected
 *
 * TIPS:
 * - Keep filenames consistent with what you have in /images/styles/
 * - Labels should be short and descriptive
 * - Positive prompts should describe the style you want
 * - Negative prompts should describe what you want to avoid for that style
 */

export const STYLE_PRESETS = {
  almaTadema: {
    image: "alma-tadema.png",
    name: "Dipinto di Lawrence Alma Tadema",
    positivePrompt: "lawrence alma tadema painting style, classical painting, detailed, realistic, vibrant colors",
    negativePrompt: "modern, digital, pixelated, low quality"
  },

  silentFilm: {
    image: "silent-film.png",
    name: "Film muto",
    positivePrompt: " A dramatic black-and-white cinematic still in the style of a 1920s silent film. High-contrast lighting with deep shadows, film grain texture, soft lens blur, and slightly faded tones. Classical Italian set design with monumental architecture and dramatic costumes. Expressionist atmosphere, strong chiaroscuro, subtle sepia tint, and vintage film imperfections like scratches and vignetting. Framed as if from an old nitrate film reel, evoking early cinema grandeur and silent movie storytelling.",
    negativePrompt: "modern photography, sharp HD clarity, oversaturated colors, neon lighting, CGI, digital rendering, 3D look, contemporary clothing, futuristic architecture, glossy textures, modern cityscapes, lens flares, text overlays, logos, cartoon style, anime, illustration, HDR, unrealistic proportions, modern makeup, selfie, cell phone, digital camera artifacts, modern fashion, contemporary furniture, computer-generated backgrounds"
  },

  orientalist: {
    image: "orientalist.png",
    name: "Orientale",
    positivePrompt: " A majestic design blending Persian and Egyptian elements. Rich Persian geometric patterns, arabesque motifs, intricate mosaics, and ornate calligraphy interwoven with Egyptian lotus columns, hieroglyphic friezes, and gilded accents. Flowing drapery, patterned textiles, carved stone details, and brass or gold ornamentation. Harmonious fusion of ancient Middle Eastern opulence with North African grandeur, evoking an exotic, timeless, cinematic aesthetic. Warm tones of gold, deep red, lapis lazuli, and turquoise, lit with soft mystical light, as if from an ancient legend or silent film stage set.",
    negativePrompt: "modern elements, contemporary design, minimalism, plastic, neon, digital screens, futuristic or sci-fi themes, cyberpunk, steampunk, anime, cartoon, comic style, CGI look, HDR effects, modern clothing, streetwear, casual furniture, industrial aesthetics, clutter, distortions, unrealistic anatomy, exaggerated fantasy features, text overlays, watermarks, logos."
  },

  dramaticPoster: {
    image: "dramatic-poster.png",
    name: "Poster drammatico",
    positivePrompt: " art nouveau poster of a movie, poster style illustration, dramatic lighting, vintage 800 aesthetic",
    negativePrompt: "modern photography, sharp HD clarity, oversaturated colors, neon lighting, CGI, digital rendering, 3D look, contemporary clothing, futuristic architecture, glossy textures, modern cityscapes, lens flares, text overlays, logos, cartoon style, anime, illustration, HDR, unrealistic proportions, modern makeup, selfie, cell phone, digital camera artifacts, modern fashion, contemporary furniture, computer-generated backgrounds"
  },

  cabiria: {
    image: "cabiria.png",
    name: "Cabiria",
    positivePrompt: "watercolor, soft washes, delicate details, nature scenes",
    negativePrompt: "oil painting, thick paint, heavy brushstrokes"
  },

  japaneseIllustration: {
    image: "japanese-illustration.png",
    name: "Illustrazione giapponese",
    positivePrompt: "japanese painting style",
    negativePrompt: "realistic, photorealistic, curved lines"
  },

  romanArena: {
    image: "roman-arena.png",
    name: "Arena romana",
    positivePrompt: "ancient roman arena, dramatic, film grain",
    negativePrompt: "statue, marble"
  },

  kandinsky: {
    image: "kandinsky.png",
    name: "Quadro di kandinsky",
    positivePrompt: "kandinsky style, abstract shapes, vibrant colors, geometric patterns",
    negativePrompt: "realistic, figurative, photorealistic"
  },

  artNouveau: {
    image: "art-nouveau.png",
    name: "Dipinto art nouveau",
    positivePrompt: "art nouveau, flowing lines, organic shapes, intricate details",
    negativePrompt: "geometric, angular, minimalist"
  },

  vector: {
    image: "vector.png",
    name: "Vector style",
    positivePrompt: "vector style illustration, bidimensional",
    negativePrompt: "realistic"
  },

  popArt: {
    image: "pop-art.png",
    name: "Pop-art",
    positivePrompt: "pop art, bold colors, comic book style, cultural references",
    negativePrompt: "muted colors, realistic, classical"
  },

  volcanicEruption: {
    image: "volcanic-eruption.png",
    name: "Eruzione vulcanica",
    positivePrompt: "vulcanic lava eruption in an ancient city, columns collapsing with a volcano erupting in the background",
    negativePrompt: "close up"
  }
};

/**
 * QUICK REFERENCE:
 *
 * To change a thumbnail: Update the "image" field with your new filename
 * To change the label: Update the "name" field
 * To change the positive prompt: Update the "positivePrompt" field
 * To add/change negative prompt: Update the "negativePrompt" field
 * To show/hide a preset or move it between sections: Edit STYLE_LAYOUT above
 *
 * EXAMPLE - A new preset:
 *
 * myPreset: {
 *   image: "my-preset.png",           // ← file in /images/styles/
 *   name: "My Preset",                // ← label in the UI
 *   positivePrompt: "...",
 *   negativePrompt: "..."
 * }
 *
 * That's it! The UI will automatically update when you reload the page.
 */
