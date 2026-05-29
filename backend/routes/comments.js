const express = require('express');
const router = express.Router();
const { extractVideoId, getVideoDetails, getVideoComments } = require('../services/youtubeService');
const { analyzeCommentsForNextVideo } = require('../services/aiService');

// Paid-only middleware
function requirePaid(req, res, next) {
  const isPaid = req.headers['x-subscription'] === 'paid' || 
                 req.body?.isPaid === true ||
                 req.query?.isPaid === 'true';
  
  if (!isPaid) {
    return res.status(403).json({
      error: 'Premium Feature',
      message: 'Comment analysis sirf paid users ke liye available hai. Upgrade karein!',
      feature: 'comment_analysis',
      upgradeRequired: true
    });
  }
  
  next();
}

// POST /api/comments/analyze - Analyze comments (PAID only)
router.post('/analyze', requirePaid, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL required' });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log(`Analyzing comments for: ${videoId}`);

    // Fetch video + comments in parallel
    const [videoData, comments] = await Promise.all([
      getVideoDetails(videoId),
      getVideoComments(videoId, 100)
    ]);

    if (comments.length === 0) {
      return res.status(400).json({ 
        error: 'No comments found',
        message: 'Is video mein comments disabled hain ya comments nahi hain'
      });
    }

    // AI comment analysis
    const analysis = await analyzeCommentsForNextVideo(videoData, comments);

    res.json({
      success: true,
      videoData: {
        id: videoData.id,
        title: videoData.title,
        channel: videoData.channelTitle,
        thumbnail: videoData.thumbnailUrl,
        commentCount: videoData.commentCount
      },
      commentsAnalyzed: comments.length,
      analysis,
      isPaid: true
    });

  } catch (error) {
    console.error('Comment analysis error:', error.message);
    
    if (error.message.includes('disabled')) {
      return res.status(400).json({ error: 'Comments disabled', message: error.message });
    }
    
    res.status(500).json({ error: 'Analysis failed', message: error.message });
  }
});

module.exports = router;
