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
// POST /api/clips/download-clip - Download & cut video clip
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const TMP_DIR = '/tmp/clips';
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

router.post('/download-clip', (req, res) => {
  const { videoUrl, startTime, endTime, title } = req.body;

  if (!videoUrl || startTime === undefined || endTime === undefined) {
    return res.status(400).json({ error: 'videoUrl, startTime, endTime required hai' });
  }

  const id = uuidv4();
  const rawFile = path.join(TMP_DIR, `${id}_raw.mp4`);
  const clipFile = path.join(TMP_DIR, `${id}_clip.mp4`);
  const safeTitle = (title || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_');
  const duration = endTime - startTime;

  const ytdlpCmd = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawFile}" "${videoUrl}"`;

  exec(ytdlpCmd, { timeout: 120000 }, (err, stdout, stderr) => {
    if (err) {
      console.error('yt-dlp error:', stderr);
      return res.status(500).json({ error: 'Video download fail hua', details: stderr });
    }

    const ffmpegCmd = `ffmpeg -ss ${startTime} -i "${rawFile}" -t ${duration} -c:v libx264 -c:a aac -avoid_negative_ts make_zero "${clipFile}" -y`;

    exec(ffmpegCmd, { timeout: 60000 }, (err2, stdout2, stderr2) => {
      fs.unlink(rawFile, () => {});

      if (err2) {
        console.error('ffmpeg error:', stderr2);
        return res.status(500).json({ error: 'Clip cut fail hua', details: stderr2 });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
      res.setHeader('Content-Type', 'video/mp4');

      const stream = fs.createReadStream(clipFile);
      stream.pipe(res);
      stream.on('end', () => fs.unlink(clipFile, () => {}));
      stream.on('error', () => fs.unlink(clipFile, () => {}));
    });
  });
});
module.exports = router;
