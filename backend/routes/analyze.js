const express = require('express');
const router = express.Router();
const { extractVideoId, getVideoDetails, parseDuration } = require('../services/youtubeService');
const { findViralClips } = require('../services/aiService');
const { checkFreeUsage, incrementUsage, getUsageStats } = require('../middleware/usageLimit');

// POST /api/analyze - Analyze a YouTube video
router.post('/', checkFreeUsage, async (req, res) => {
  try {
    const { url, isPaid } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'YouTube URL required hai' });
    }

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ 
        error: 'Invalid YouTube URL',
        message: 'Valid YouTube URL do jaise: https://youtube.com/watch?v=...'
      });
    }

    console.log(`Analyzing video: ${videoId}`);

    // Fetch video details from YouTube API
    const videoData = await getVideoDetails(videoId);
    
    // Parse duration
    const durationSeconds = parseDuration(videoData.duration);
    videoData.durationSeconds = durationSeconds;
    videoData.durationFormatted = formatDuration(durationSeconds);

    // Determine clip count (paid = more analysis)
    const clipCount = req.isPaid ? 5 : 3;

    // AI analysis
    const clipAnalysis = await findViralClips(videoData, clipCount);

    // Increment usage for free users
    await incrementUsage(req);
   const usageStats = await getUsageStats(req);
    res.json({
      success: true,
      videoData: {
        id: videoData.id,
        title: videoData.title,
        channel: videoData.channelTitle,
        thumbnail: videoData.thumbnailUrl,
        duration: videoData.durationFormatted,
        durationSeconds: durationSeconds,
        views: formatNumber(videoData.viewCount),
        likes: formatNumber(videoData.likeCount),
        comments: formatNumber(videoData.commentCount),
        publishedAt: videoData.publishedAt,
        url: `https://youtube.com/watch?v=${videoData.id}`
      },
      analysis: clipAnalysis,
      usage: usageStats,
      isPaid: req.isPaid
    });

  } catch (error) {
    console.error('Analysis error:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Video nahi mila', message: error.message });
    }
    if (error.message.includes('API quota')) {
      return res.status(429).json({ error: 'YouTube API limit', message: error.message });
    }
    
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
});

// GET /api/analyze/usage - Check user's usage
router.get('/usage', async (req, res) => {
  const stats = await getUsageStats(req);
  res.json(stats);
});

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

module.exports = router;
