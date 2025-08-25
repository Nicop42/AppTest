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
    name: "Renaissance Art",
    positivePrompt: "renaissance painting, highly detailed, vibrant colors, 4k, trending on artstation, masterpiece",
    negativePrompt: "modern, digital, pixelated, low quality"
  },
  
  style2: {
    image: "stile2.png", 
    name: "Pencil Sketch",
    positivePrompt: "pencil sketch, detailed linework, monochrome, hatching, cross-hatching, artistic drawing",
    negativePrompt: "colorful, painted, digital, photorealistic"
  },
  
  style3: {
    image: "stile3.png",
    name: "Impressionist", 
    positivePrompt: "impressionist style, soft brush strokes, vibrant colors, natural light",
    negativePrompt: "sharp, defined edges, digital"
  },
  
  style4: {
    image: "stile4.jpg",
    name: "Cartoon",
    positivePrompt: "cartoon style, bold outlines, bright colors, exaggerated features",
    negativePrompt: "realistic, photorealistic, dark, gritty"
  },
  
  style5: {
    image: "stile5.png", 
    name: "Watercolor",
    positivePrompt: "japanese watercolor, soft washes, delicate details, nature scenes",
    negativePrompt: "oil painting, thick paint, heavy brushstrokes"
  },
  
  style6: {
    image: "stile6.png",
    name: "Cubism", 
    positivePrompt: "cubism painting style, mondrian style, vibrant geometric shapes, abstract composition",
    negativePrompt: "realistic, photorealistic, curved lines"
  },
  
  style7: {
    image: "stile7.png",
    name: "Abstract",
    positivePrompt: "kandinsky style, abstract shapes, vibrant colors, geometric patterns", 
    negativePrompt: "realistic, figurative, photorealistic"
  },
  
  style8: {
    image: "stile8.png", 
    name: "Art Nouveau",
    positivePrompt: "art nouveau, flowing lines, organic shapes, intricate details",
    negativePrompt: "geometric, angular, minimalist"
  },
  
  style9: {
    image: "stile9.png",
    name: "Vector",
    positivePrompt: "vector style, vibrant colors with brushstrokes, clean lines, flat design", 
    negativePrompt: "sketchy, rough, textured, photorealistic"
  },
  
  style10: {
    image: "stile10.png",
    name: "PopArt", 
    positivePrompt: "pop art, bold colors, comic book style, cultural references",
    negativePrompt: "muted colors, realistic, classical"
  },
  
  style11: {
    image: "stile11.png",
    name: "Steampunk",
    positivePrompt: "steampunk style, intricate details, Victorian aesthetics, machinery, gears",
    negativePrompt: "modern, minimalistic, flat design"
  },
  
  style12: {
    image: "stile12.png", 
    name: "Surreal",
    positivePrompt: "surreal painting, dreamlike scenes, bizarre imagery, vibrant colors, dali style",
    negativePrompt: "smooth, digital, realistic, sharp edges"
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
