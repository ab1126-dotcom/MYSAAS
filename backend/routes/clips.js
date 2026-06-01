const express = require('express');
const router = express.Router();
const { generateHooks, generateSEO } = require('../services/aiService');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const https = require('https');

const TMP_DIR = '/tmp/clips';
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// POST /api/clips/hooks
router.post('/hooks', async (req, res) => {
  try {
    const { clipData, videoTitle, isPaid } = req.body;
    if (!clipData || !videoTitle) {
      return res.status(400).json({ error: 'clipData and videoTitle required' });
    }
    const hooks = await generateHooks(clipData, videoTitle);
    res.json({ success: true, hooks, clipId: clipData.id });
  } catch (error) {
    console.error('Hooks error:', error.message);
    res.status(500).json({ error: 'Hook generation failed', message: error.message });
  }
});

// POST /api/clips/seo
router.post('/seo', async (req, res) => {
  try {
    const { videoData, clipData, isPaid } = req.body;
    if (!videoData || !clipData) {
      return res.status(400).json({ error: 'videoData and clipData required' });
    }
    const seo = await generateSEO(videoData, clipData);
    res.json({ success: true, seo, clipId: clipData.id });
  } catch (error) {
    console.error('SEO error:', error.message);
    res.status(500).json({ error: 'SEO generation failed', message: error.message });
  }
});

// POST /api/clips/download-clip
router.post('/download-clip', async (req, res) => {
  const { videoUrl, startTime, endTime, title } = req.body;

  if (!videoUrl || startTime === undefined || endTime === undefined) {
    return res.status(400).json({ error: 'videoUrl, startTime, endTime required hai' });
  }

  const parseTime = (t) => {
    if (typeof t === 'number') return t;
    const parts = String(t).split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return parseFloat(t) || 0;
  };

  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const duration = end - start;

  const id = uuidv4();
  const rawFile = path.join(TMP_DIR, `${id}_raw.mp4`);
  const clipFile = path.join(TMP_DIR, `${id}_clip.mp4`);
  const safeTitle = (title || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    // Extract video ID
    const videoIdMatch = videoUrl.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    const videoId = videoIdMatch[1];

    // Get download URL from RapidAPI
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const apiUrl = `https://yt-api.p.rapidapi.com/dl?id=${videoId}`;

    const apiResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'yt-api.p.rapidapi.com',
        path: `/dl?id=${videoId}`,
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'yt-api.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.end();
    });

    // Find best mp4 format
    const formats = apiResponse.formats || [];
    const mp4Format = formats.find(f => f.ext === 'mp4' && f.vcodec !== 'none') ||
                      formats.find(f => f.ext === 'mp4') ||
                      formats[0];

    if (!mp4Format || !mp4Format.url) {
      return res.status(500).json({ error: 'Download URL nahi mila' });
    }

    const downloadUrl = mp4Format.url;

    // Download video file
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(rawFile);
      https.get(downloadUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (err) => {
        fs.unlink(rawFile, () => {});
        reject(err);
      });
    });

    // Cut clip with FFmpeg
    const ffmpegCmd = `ffmpeg -ss ${start} -i "${rawFile}" -t ${duration} -c:v libx264 -preset ultrafast -crf 28 -c:a aac -b:a 128k -vf scale=720:-2 -avoid_negative_ts make_zero -threads 1 "${clipFile}" -y`;

    await new Promise((resolve, reject) => {
      exec(ffmpegCmd, { timeout: 60000 }, (err, stdout, stderr) => {
        fs.unlink(rawFile, () => {});
        if (err) reject(new Error(stderr));
        else resolve();
      });
    });

    // Send clip
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    const stream = fs.createReadStream(clipFile);
    stream.pipe(res);
    stream.on('end', () => fs.unlink(clipFile, () => {}));
    stream.on('error', () => fs.unlink(clipFile, () => {}));

  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ error: 'Clip download fail hua', details: err.message });
  }
});

module.exports = router;
module.exports = router;
