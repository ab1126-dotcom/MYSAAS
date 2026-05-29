const express = require('express');
const router = express.Router();
const { generateHooks, generateSEO } = require('../services/aiService');

// POST /api/clips/hooks - Generate viral hooks for a clip
router.post('/hooks', async (req, res) => {
  try {
    const { clipData, videoTitle, isPaid } = req.body;
    
    if (!clipData || !videoTitle) {
      return res.status(400).json({ error: 'clipData and videoTitle required' });
    }

    const hooks = await generateHooks(clipData, videoTitle);
    
    res.json({
      success: true,
      hooks,
      clipId: clipData.id
    });

  } catch (error) {
    console.error('Hooks error:', error.message);
    res.status(500).json({ error: 'Hook generation failed', message: error.message });
  }
});

// POST /api/clips/seo - Generate SEO package for a clip
router.post('/seo', async (req, res) => {
  try {
    const { videoData, clipData, isPaid } = req.body;
    
    if (!videoData || !clipData) {
      return res.status(400).json({ error: 'videoData and clipData required' });
    }

    const seo = await generateSEO(videoData, clipData);
    
    res.json({
      success: true,
      seo,
      clipId: clipData.id
    });

  } catch (error) {
    console.error('SEO error:', error.message);
    res.status(500).json({ error: 'SEO generation failed', message: error.message });
  }
});

module.exports = router;
