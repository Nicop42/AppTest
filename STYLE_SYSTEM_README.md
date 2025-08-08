# 🎨 Dynamic Style System Documentation

## Overview

The style system is now fully dynamic and controlled by the `styleConfig.js` file. When you change anything in the configuration, the HTML interface will automatically update to reflect those changes.

## How It Works

### Configuration Files

1. **`web/js/styleConfig.js`** - Main configuration file containing:
   - `STYLE_CONFIG` - Object with all style definitions
   - `DISPLAY_CONFIG` - Controls which styles appear in primary vs "more styles" sections

### Key Features

✅ **Fully Dynamic** - No hardcoded HTML style buttons  
✅ **Auto-Update** - Changes in config immediately reflect in UI  
✅ **Easy Management** - All styles managed in one place  
✅ **Flexible Layout** - Control which styles appear where  

## Making Changes

### To Change a Style

Edit the style in `styleConfig.js`:

```javascript
style1: {
  image: "my_new_image.png",     // ← Change image file
  name: "My New Style",          // ← Change button name
  positivePrompt: "...",         // ← Change positive prompt
  negativePrompt: "..."          // ← Change negative prompt
}
```

### To Add a New Style

1. Add the style definition to `STYLE_CONFIG`:

```javascript
style13: {
  image: "new_style.png",
  name: "New Style Name",
  positivePrompt: "new style prompt",
  negativePrompt: "what to avoid"
}
```

2. Add the style ID to either `primaryStyles` or `moreStyles` in `DISPLAY_CONFIG`:

```javascript
export const DISPLAY_CONFIG = {
  primaryStyles: ['style1', 'style2', '...', 'style13'], // ← Add here for main section
  moreStyles: ['style8', 'style9', '...']                // ← Or here for "more styles"
};
```

### To Remove a Style

1. Remove from `STYLE_CONFIG`
2. Remove from `DISPLAY_CONFIG` arrays
3. The UI will automatically update

### To Reorganize Style Layout

Simply move style IDs between the `primaryStyles` and `moreStyles` arrays in `DISPLAY_CONFIG`.

## Files Modified

- ✅ `web/index.html` - Removed hardcoded style buttons, added dynamic containers
- ✅ `web/js/styleManager.js` - Complete rewrite for dynamic generation
- ✅ `web/js/styleConfig.js` - Added `DISPLAY_CONFIG` for layout control
- ✅ `web/js/app.js` - Updated imports

## Technical Details

The `StyleManager` class now:
- Dynamically generates all style buttons from configuration
- Automatically handles image paths, names, and prompts
- Provides methods for runtime style management
- Maintains backward compatibility with existing prompt logic

### Available Methods

```javascript
// Update an existing style
styleManager.updateStyleConfig('style1', { name: 'New Name', image: 'new.png' });

// Add a new style
styleManager.addNewStyle('style13', { image: 'new.png', name: 'New Style', ... });

// Remove a style
styleManager.removeStyle('style13');
```

## Benefits

1. **No More HTML Editing** - All changes happen in one JavaScript file
2. **Automatic Synchronization** - UI always matches configuration
3. **Easy Maintenance** - Centralized style management
4. **Runtime Flexibility** - Styles can be modified programmatically
5. **No Code Duplication** - Single source of truth for all style data

---

**🎯 Result**: Now when you change a name, description, or image in `styleConfig.js`, it automatically updates in the HTML interface!
