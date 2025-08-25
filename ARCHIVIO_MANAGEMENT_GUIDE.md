# 🖼️ Easy Archivio Image Management System

## Overview

The archivio (museum) image management system has been completely redesigned to make it super easy to change image names, reorder images, and add new ones without touching the HTML code!

## 📁 Files Involved

- **`web/js/archivioConfig.js`** - Main configuration file where you change image names and order
- **`web/js/archivioManager.js`** - Handles the dynamic generation of the carousel (don't edit this)
- **`web/js/app.js`** - Updated to initialize the archivio system (already configured)
- **`web/index.html`** - Simplified HTML structure (already updated)

## 🎯 How to Change Image Names

### Step 1: Open the Configuration File
Navigate to `web/js/archivioConfig.js`

### Step 2: Find the Image You Want to Change
Look for the image entry, for example:
```javascript
archivio7: {
  image: "archivio7.jpg",
  name: "Historical Painting",  // ← This is what appears under the image
  order: 1
},
```

### Step 3: Change the Name
Simply edit the `name` field:
```javascript
archivio7: {
  image: "archivio7.jpg",
  name: "My New Amazing Artwork Name",  // ← Changed!
  order: 1
},
```

### Step 4: Save and Reload
Save the file and refresh your webpage. The new name will appear automatically!

## 🔄 How to Reorder Images

Change the `order` number:
```javascript
archivio1: {
  image: "archivio1.jpg",
  name: "Classical Portrait",
  order: 1  // ← This will be first (leftmost)
},

archivio2: {
  image: "archivio2.jpg", 
  name: "Renaissance Scene",
  order: 3  // ← This will be third
},
```

## ➕ How to Add New Images

### Step 1: Add Your Image File
Place your new image in the `web/images/` folder (e.g., `my_new_image.jpg`)

### Step 2: Add Configuration Entry
Add a new entry to `ARCHIVIO_CONFIG` in `archivioConfig.js`:
```javascript
archivio11: {  // ← Use next available number
  image: "my_new_image.jpg",  // ← Your image filename
  name: "My New Artwork",     // ← Name to display
  order: 11                   // ← Position in carousel
}
```

## 🖼️ How to Change Image Files

### Step 1: Replace the Physical File
Replace the image file in the `web/images/` folder, OR add a new image file

### Step 2: Update the Configuration
If using a new filename, update the `image` field:
```javascript
archivio1: {
  image: "my_new_filename.jpg",  // ← Changed filename
  name: "Classical Portrait",
  order: 9
},
```

## 📋 Current Image Configuration

Here's what each archivio image currently displays:

| Order | Image File | Display Name |
|-------|------------|-------------|
| 1 | archivio7.jpg | Historical Painting |
| 2 | archivio2.jpg | Renaissance Scene |
| 3 | archivio8.jpg | Artistic Study |
| 4 | archivio3.jpg | Baroque Masterpiece |
| 5 | archivio4.jpg | Impressionist Landscape |
| 6 | archivio5.jpg | Modern Abstract |
| 7 | archivio6.jpg | Contemporary Art |
| 8 | archivio9.jpg | Cultural Heritage |
| 9 | archivio1.jpg | Classical Portrait |
| 10 | archivio10.jpg | Museum Collection |

## ✨ Examples

### Example 1: Changing Multiple Names at Once
```javascript
export const ARCHIVIO_CONFIG = {
  archivio1: {
    image: "archivio1.jpg",
    name: "Mona Lisa Style", // ← Changed
    order: 1
  },
  
  archivio2: {
    image: "archivio2.jpg", 
    name: "Van Gogh Inspired", // ← Changed
    order: 2
  },
  
  archivio3: {
    image: "archivio3.jpg",
    name: "Picasso Abstract", // ← Changed
    order: 3
  }
  // ... etc
};
```

### Example 2: Completely Reordering Images
```javascript
// Put archivio10 first, archivio1 second, etc.
archivio10: {
  image: "archivio10.jpg",
  name: "Museum Collection",
  order: 1  // ← Now appears first
},

archivio1: {
  image: "archivio1.jpg",
  name: "Classical Portrait",
  order: 2  // ← Now appears second
}
```

### Example 3: Adding Multiple New Images
```javascript
// Add these to the ARCHIVIO_CONFIG object
newArt1: {
  image: "custom_painting1.jpg",
  name: "Custom Artwork 1",
  order: 11
},

newArt2: {
  image: "custom_painting2.jpg",
  name: "Custom Artwork 2", 
  order: 12
}
```

## 🚨 Important Notes

1. **File Names**: Make sure the `image` field matches exactly with your file in the `images/` folder
2. **Unique Orders**: Each image should have a unique order number
3. **Refresh Required**: After making changes, refresh your webpage to see updates
4. **Backup**: Keep a backup of your `archivioConfig.js` file before making major changes

## 🛠️ Troubleshooting

**Images not showing?**
- Check that the filename in `image` field matches exactly with the file in `images/` folder
- Check browser console for any error messages

**Names not updating?**
- Make sure you saved the `archivioConfig.js` file
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)

**Wrong order?**
- Check that order numbers are unique and start from 1
- Lower numbers appear first (left side of carousel)

## 🎉 That's It!

You now have complete control over your archivio images without ever touching HTML code again! Just edit the configuration file and reload the page.
