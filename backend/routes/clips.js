const express = require('express');
const router = express.Router();
const { generateHooks, generateSEO } = require('../services/aiService');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const http = require('http');

const TMP_DIR = '/tmp/clips';
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Helper: download with full redirect support
function downloadFile(url, destPath, maxRedirects = 10) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) return reject(new Error('Too many redirects'));

    const lib = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    const request = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlink(destPath, () => {});
        return downloadFile(response.headers.location, destPath, maxRedirects - 1)
          .then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`HTTP ${response.statusCode}`));
      }

      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
    });

    request.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });

    request.setTimeout(60000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
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
    return res.status(400).json({ error: 'videoUrl, startTime, endTime required' });
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
    const videoIdMatch = videoUrl.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    const videoId = videoIdMatch[1];

    // Get download URL from RapidAPI
    const rapidApiKey = process.env.RAPIDAPI_KEY;

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
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(new Error('Invalid API response')); }
        });
      });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('API timeout')); });
      req.end();
    });

    console.log('RapidAPI status:', apiResponse.status);
    console.log('Formats count:', (apiResponse.formats || []).length);

    const formats = apiResponse.formats || [];
    
    // Best format: mp4 with video, 720p preferred
    const mp4Format = 
      formats.find(f => f.ext === 'mp4' && f.vcodec !== 'none' && f.height === 720) ||
      formats.find(f => f.ext === 'mp4' && f.vcodec !== 'none' && f.height === 480) ||
      formats.find(f => f.ext === 'mp4' && f.vcodec !== 'none') ||
      formats.find(f => f.ext === 'mp4') ||
      formats[0];

    if (!mp4Format || !mp4Format.url) {
      console.error('API response:', JSON.stringify(apiResponse).substring(0, 500));
      return res.status(500).json({ error: 'No download URL found from API' });
    }

    console.log('Downloading format:', mp4Format.ext, mp4Format.height, 'p');
    console.log('Download URL:', mp4Format.url.substring(0, 80));

    // Download with full redirect support
    await downloadFile(mp4Format.url, rawFile);

    // Verify file size
    const stats = fs.statSync(rawFile);
    console.log('Downloaded file size:', stats.size, 'bytes');
    if (stats.size < 10000) {
      throw new Error(`Downloaded file too small: ${stats.size} bytes — likely corrupt`);
    }

    // Cut clip with FFmpeg
    const ffmpegCmd = `ffmpeg -ss ${start} -i "${rawFile}" -t ${duration} -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -vf scale=1080:-2 -avoid_negative_ts make_zero -threads 1 "${clipFile}" -y 2>&1`;

    await new Promise((resolve, reject) => {
      exec(ffmpegCmd, { timeout: 120000 }, (err, stdout, stderr) => {
        fs.unlink(rawFile, () => {});
        if (err) {
          console.error('FFmpeg error:', stderr);
          reject(new Error(stderr || err.message));
        } else {
          resolve();
        }
      });
    });

    // Verify clip was created
    if (!fs.existsSync(clipFile)) {
      throw new Error('FFmpeg did not create output file');
    }

    // Send clip
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    const stream = fs.createReadStream(clipFile);
    stream.pipe(res);
    stream.on('end', () => fs.unlink(clipFile, () => {}));
    stream.on('error', () => fs.unlink(clipFile, () => {}));

  } catch (err) {
    console.error('Download error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Clip download failed', details: err.message });
    }
  }
});

module.exports = router;

