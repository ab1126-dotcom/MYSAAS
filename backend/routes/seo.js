const express = require('express');
const router = express.Router();
const { generateSEO } = require('../services/aiService');

// POST /api/seo/generate
router.post('/generate', async (req, res) => {
  try {
    const { videoData, clipData } = req.body;
    
    if (!videoData || !clipData) {
      return res.status(400).json({ error: 'videoData and clipData required' });
    }

    const seo = await generateSEO(videoData, clipData);
    
    res.json({ success: true, seo });
  } catch (error) {
    res.status(500).json({ error: 'SEO generation failed', message: error.message });
  }
});

module.exports = router;
