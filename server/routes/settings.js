import express from 'express';
import Settings from '../models/Settings.js';
import { protect, admin } from '../middleware/auth.js';
import { clearScraperAPIKeyCache } from '../utils/getScraperAPIKey.js';
import { upload } from '../middleware/upload.js';
import { readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Public endpoint for general settings (for frontend display)
router.get('/public', async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    // Return only general settings for public access
    res.json({ 
      success: true, 
      settings: {
        general: settings.general,
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
});

// Upload image endpoint - Convert to base64 and store in database
router.post('/upload', protect, admin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف' });
    }
    
    // Read the file and convert to base64
    const filePath = join(__dirname, '../../uploads', req.file.filename);
    const fileBuffer = readFileSync(filePath);
    const base64String = fileBuffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64String}`;
    
    // Delete the temporary file after converting to base64
    try {
      unlinkSync(filePath);
    } catch (deleteError) {
      console.warn('Failed to delete temporary file:', deleteError);
    }
    
    // Return base64 data URL to be stored in database
    res.json({ 
      success: true, 
      dataUrl: dataUrl, // Store this in database instead of file path
      mimeType: mimeType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file if conversion failed
    if (req.file) {
      try {
        const filePath = join(__dirname, '../../uploads', req.file.filename);
        unlinkSync(filePath);
      } catch (deleteError) {
        console.warn('Failed to delete temporary file:', deleteError);
      }
    }
    
    res.status(500).json({ success: false, message: 'فشل في رفع الملف' });
  }
});

router.put('/', protect, admin, async (req, res, next) => {
  try {
    // Use findOneAndUpdate with upsert to handle version conflicts
    // This prevents "No matching document found" errors
    const updateData = req.body;
    
    // Helper function to remove undefined values from nested objects
    const removeUndefined = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => typeof item === 'object' && item !== null ? removeUndefined(item) : item);
      } else if (typeof obj === 'object' && obj !== null) {
        const cleaned = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              cleaned[key] = removeUndefined(obj[key]);
            } else {
              cleaned[key] = obj[key];
            }
          }
        });
        return cleaned;
      }
      return obj;
    };
    
    // Build update object for MongoDB
    const updateObject = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'localStores' || key === 'supportedStores') {
          // Arrays - set directly
          updateObject[key] = removeUndefined(updateData[key]);
        } else if (key === 'footer' && updateData.footer && typeof updateData.footer === 'object') {
          // Special handling for footer.footerLinks (contains arrays)
          if (updateData.footer.footerLinks) {
            updateObject['footer.footerLinks'] = updateData.footer.footerLinks;
          }
          // Handle other footer properties
          Object.keys(updateData.footer).forEach(footerKey => {
            if (footerKey !== 'footerLinks' && updateData.footer[footerKey] !== undefined) {
              if (typeof updateData.footer[footerKey] === 'object' && !Array.isArray(updateData.footer[footerKey])) {
                // Nested object in footer (e.g., socialLinks)
                Object.keys(updateData.footer[footerKey]).forEach(nestedKey => {
                  if (updateData.footer[footerKey][nestedKey] !== undefined) {
                    updateObject[`footer.${footerKey}.${nestedKey}`] = updateData.footer[footerKey][nestedKey];
                  }
                });
              } else {
                updateObject[`footer.${footerKey}`] = updateData.footer[footerKey];
              }
            }
          });
        } else if (typeof updateData[key] === 'object' && updateData[key] !== null && !Array.isArray(updateData[key])) {
          // For nested objects, use $set with dot notation
          Object.keys(updateData[key]).forEach(nestedKey => {
            if (updateData[key][nestedKey] !== undefined) {
              if (typeof updateData[key][nestedKey] === 'object' && !Array.isArray(updateData[key][nestedKey])) {
                // Double nested object
                Object.keys(updateData[key][nestedKey]).forEach(deepKey => {
                  if (updateData[key][nestedKey][deepKey] !== undefined) {
                    updateObject[`${key}.${nestedKey}.${deepKey}`] = updateData[key][nestedKey][deepKey];
                  }
                });
              } else {
                updateObject[`${key}.${nestedKey}`] = updateData[key][nestedKey];
              }
            }
          });
        } else {
          updateObject[key] = updateData[key];
        }
      }
    });
    
    // Use findOneAndUpdate with upsert to handle version conflicts
    const settings = await Settings.findOneAndUpdate(
      {}, // Find any document
      { $set: updateObject },
      { 
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: false, // Skip validators to avoid version conflicts
        setDefaultsOnInsert: true // Set defaults when creating
      }
    );
    
    // Clear ScraperAPI key cache after settings update
    clearScraperAPIKeyCache();
    
    // Return fresh settings
    const updatedSettings = await Settings.getSettings();
    res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('Settings update error:', error);
    
    // If error is about document not found or version conflict, try alternative approach
    if (error.message && (error.message.includes('No matching document') || error.message.includes('version'))) {
      try {
        // Try to get existing document or create new
        let settings = await Settings.findOne();
        if (!settings) {
          settings = await Settings.create({});
        }
        
        // Update manually without version checking
        const updateData = req.body;
        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined) {
            if (key === 'localStores' || key === 'supportedStores') {
              settings[key] = updateData[key];
              settings.markModified(key);
            } else if (key === 'footer' && updateData.footer) {
              // Special handling for footer with footerLinks arrays
              if (!settings.footer) {
                settings.footer = {};
              }
              if (updateData.footer.footerLinks) {
                settings.footer.footerLinks = updateData.footer.footerLinks;
              }
              Object.keys(updateData.footer).forEach(footerKey => {
                if (footerKey !== 'footerLinks') {
                  settings.footer[footerKey] = updateData.footer[footerKey];
                }
              });
              settings.markModified('footer');
            } else if (typeof updateData[key] === 'object' && updateData[key] !== null && !Array.isArray(updateData[key])) {
              settings[key] = { ...(settings[key] || {}), ...updateData[key] };
              settings.markModified(key);
            } else {
              settings[key] = updateData[key];
            }
          }
        });
        
        // Save without version checking
        await settings.save({ validateBeforeSave: false });
        clearScraperAPIKeyCache();
        const updatedSettings = await Settings.getSettings();
        return res.json({ success: true, settings: updatedSettings });
      } catch (fallbackError) {
        console.error('Fallback update error:', fallbackError);
      }
    }
    
    next(error);
  }
});

export default router;
