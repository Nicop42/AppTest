// ✨ EASY STYLE CONFIGURATION SCRIPT ✨
// This file makes it super easy to manage your styles!
// Just edit the values below and the UI will automatically update.

/**
 * DISPLAY CONFIGURATION
 * Define which styles appear in the main section vs "more styles" section
 */
export const DISPLAY_CONFIG = {
  // Styles that appear in the main visible section (first 8 styles)
  primaryStyles: ['style1', 'style2', 'style3', 'style4', 'style5', 'style6', 'style7', 'style12'],
  
  // Styles that appear in the "more styles" hidden section
  moreStyles: ['style8', 'style9', 'style10', 'style11']
};

/**
 * Style Configuration Object
 * 
 * HOW TO USE:
 * 1. image: The filename of the image in the /images/ folder (e.g., "stile1.png")
 * 2. name: The name that will appear in the UI button
 * 3. positivePrompt: Text that gets added to the positive prompt when selected
 * 4. negativePrompt: (Optional) Text that gets added to the negative prompt when selected
 * 
 * TIPS:
 * - Keep image names consistent with what you have in your /images/ folder
 * - Style names should be short and descriptive
 * - Positive prompts should describe the style you want
 * - Negative prompts should describe what you want to avoid for that style
 */

export const STYLE_CONFIG = {
  style1: {
    image: "stile1.png",
    name: "Dipinto di Lawrence Alma Tadema",
    positivePrompt: "lawrence alma tadema painting style, classical painting, detailed, realistic, vibrant colors",
    negativePrompt: "modern, digital, pixelated, low quality"
  },
  
  style2: {
    image: "stile2.png", 
    name: "Film muto",
    positivePrompt: " A dramatic black-and-white cinematic still in the style of a 1920s silent film. High-contrast lighting with deep shadows, film grain texture, soft lens blur, and slightly faded tones. Classical Italian set design with monumental architecture and dramatic costumes. Expressionist atmosphere, strong chiaroscuro, subtle sepia tint, and vintage film imperfections like scratches and vignetting. Framed as if from an old nitrate film reel, evoking early cinema grandeur and silent movie storytelling.",
    negativePrompt: "modern photography, sharp HD clarity, oversaturated colors, neon lighting, CGI, digital rendering, 3D look, contemporary clothing, futuristic architecture, glossy textures, modern cityscapes, lens flares, text overlays, logos, cartoon style, anime, illustration, HDR, unrealistic proportions, modern makeup, selfie, cell phone, digital camera artifacts, modern fashion, contemporary furniture, computer-generated backgrounds"
  },
  
  style3: {
    image: "stile3.png",
    name: "Orientale",
    positivePrompt: " A majestic design blending Persian and Egyptian elements. Rich Persian geometric patterns, arabesque motifs, intricate mosaics, and ornate calligraphy interwoven with Egyptian lotus columns, hieroglyphic friezes, and gilded accents. Flowing drapery, patterned textiles, carved stone details, and brass or gold ornamentation. Harmonious fusion of ancient Middle Eastern opulence with North African grandeur, evoking an exotic, timeless, cinematic aesthetic. Warm tones of gold, deep red, lapis lazuli, and turquoise, lit with soft mystical light, as if from an ancient legend or silent film stage set.",
    negativePrompt: "modern elements, contemporary design, minimalism, plastic, neon, digital screens, futuristic or sci-fi themes, cyberpunk, steampunk, anime, cartoon, comic style, CGI look, HDR effects, modern clothing, streetwear, casual furniture, industrial aesthetics, clutter, distortions, unrealistic anatomy, exaggerated fantasy features, text overlays, watermarks, logos."
  },
  
  style4: {
    image: "stile4.png",
    name: "Poster drammatico",
    positivePrompt: " art nouveau poster of a movie, poster style illustration, dramatic lighting, vintage 800 aesthetic",
    negativePrompt: "modern photography, sharp HD clarity, oversaturated colors, neon lighting, CGI, digital rendering, 3D look, contemporary clothing, futuristic architecture, glossy textures, modern cityscapes, lens flares, text overlays, logos, cartoon style, anime, illustration, HDR, unrealistic proportions, modern makeup, selfie, cell phone, digital camera artifacts, modern fashion, contemporary furniture, computer-generated backgrounds"
  },
  
  style5: {
    image: "stile5.png", 
    name: "Cabiria",
    positivePrompt: "watercolor, soft washes, delicate details, nature scenes",
    negativePrompt: "oil painting, thick paint, heavy brushstrokes"
  },
  
  style6: {
    image: "stile6.png",
    name: "Illustrazione giapponese", 
    positivePrompt: "japanese painting style",
    negativePrompt: "realistic, photorealistic, curved lines"
  },
  
  style7: {
    image: "stile7.png",
    name: "Arena romana",
    positivePrompt: "ancient roman arena, dramatic, film grain", 
    negativePrompt: "statue, marble"
  },
  
  style8: {
    image: "stile8.png", 
    name: "Quadro di kandinsky",
    positivePrompt: "kandinsky style, abstract shapes, vibrant colors, geometric patterns",
    negativePrompt: "realistic, figurative, photorealistic"
  },
  
  style9: {
    image: "stile9.png",
    name: "Dipinto art nouveau",
    positivePrompt: "art nouveau, flowing lines, organic shapes, intricate details",
    negativePrompt: "geometric, angular, minimalist"
  },
  
  style10: {
    image: "stile10.png",
    name: "Vector style", 
    positivePrompt: "vector style illustration, bidimensional",
    negativePrompt: "realistic"
  },
  
  style11: {
    image: "stile11.png",
    name: "Pop-art",
    positivePrompt: "pop art, bold colors, comic book style, cultural references",
    negativePrompt: "muted colors, realistic, classical"
  },
  
  style12: {
    image: "stile12.png", 
    name: "Eruzione vulcanica",
    positivePrompt: "vulcanic lava eruption in an ancient city, columns collapsing with a volcano erupting in the background",
    negativePrompt: "close up"
  }
};

/**
 * QUICK REFERENCE:
 * 
 * To change an image: Update the "image" field with your new filename
 * To change the button name: Update the "name" field  
 * To change the positive prompt: Update the "positivePrompt" field
 * To add/change negative prompt: Update the "negativePrompt" field
 * 
 * EXAMPLE - To change style1 to use a different image and name:
 * 
 * style1: {
 *   image: "my_new_image.png",        // ← Change this
 *   name: "My Cool Style",            // ← Change this  
 *   positivePrompt: "...",            // ← Change this
 *   negativePrompt: "..."             // ← Change this
 * }
 * 
 * That's it! The UI will automatically update when you reload the page.
 */
