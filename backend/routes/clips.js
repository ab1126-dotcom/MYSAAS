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

// Total time we allow for a single file download before giving up (ms)
const DOWNLOAD_HARD_TIMEOUT = 90000; // 90 seconds

// Helper: download with full redirect support + hard total timeout + progress logging
function downloadFile(url, destPath, label = 'file', maxRedirects = 10) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) return reject(new Error('Too many redirects'));

    const lib = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    let settled = false;
    let downloadedBytes = 0;
    let totalBytes = 0;
    let lastLogTime = Date.now();

    // Hard overall timeout - fires regardless of whether data is trickling in
    const hardTimeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      request.destroy();
      file.close();
      fs.unlink(destPath, () => {});
      reject(new Error(`${label} download exceeded ${DOWNLOAD_HARD_TIMEOUT / 1000}s (likely throttled by source server)`));
    }, DOWNLOAD_HARD_TIMEOUT);

    const cleanupAndSettle = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimeout);
      fn(arg);
    };

    const request = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com',
        'Connection': 'keep-alive',
      }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        clearTimeout(hardTimeout);
        file.close();
        fs.unlink(destPath, () => {});
        settled = true;
        return downloadFile(response.headers.location, destPath, label, maxRedirects - 1)
          .then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return cleanupAndSettle(reject, new Error(`HTTP ${response.statusCode}`));
      }

      totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      console.log(`${label}: starting download, size ~${(totalBytes / 1024 / 1024).toFixed(1)} MB`);

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const now = Date.now();
        if (now - lastLogTime > 5000) { // log progress every 5s
          const pct = totalBytes ? ((downloadedBytes / totalBytes) * 100).toFixed(1) : '?';
          console.log(`${label}: ${(downloadedBytes / 1024 / 1024).toFixed(1)} MB downloaded (${pct}%)`);
          lastLogTime = now;
        }
      });

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        cleanupAndSettle(resolve);
      });
      file.on('error', (err) => {
        fs.unlink(destPath, () => {});
        cleanupAndSettle(reject, err);
      });
    });

    request.on('error', (err) => {
      fs.unlink(destPath, () => {});
      cleanupAndSettle(reject, err);
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
  const rawVideoFile = path.join(TMP_DIR, `${id}_rawvideo.mp4`);
  const rawAudioFile = path.join(TMP_DIR, `${id}_rawaudio.mp4`);
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
      const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(new Error('Invalid API response')); }
        });
      });
      apiReq.on('error', reject);
      apiReq.setTimeout(15000, () => { apiReq.destroy(); reject(new Error('API timeout')); });
      apiReq.end();
    });

    console.log('RapidAPI status:', apiResponse.status);
    console.log('Formats count:', (apiResponse.formats || []).length);

    const adaptiveFormats = apiResponse.adaptiveFormats || [];

    // Ordered list of video quality candidates - we'll try highest first,
    // and fall back to a lower quality if the higher one times out/throttles.
    const videoCandidates = [
      adaptiveFormats.find(f => f.url && f.mimeType?.includes('video/mp4') && f.height === 1080),
      adaptiveFormats.find(f => f.url && f.mimeType?.includes('video/mp4') && f.height === 720),
      adaptiveFormats.find(f => f.url && f.mimeType?.includes('video/mp4') && f.height === 480),
      adaptiveFormats.find(f => f.url && f.mimeType?.includes('video/mp4') && f.height === 360),
      adaptiveFormats.find(f => f.url && f.mimeType?.includes('video/mp4')),
    ].filter(Boolean);

    // Dedupe by url in case multiple finds matched the same format
    const seen = new Set();
    const videoFormats = videoCandidates.filter(f => {
      if (seen.has(f.url)) return false;
      seen.add(f.url);
      return true;
    });

    // Best audio from adaptiveFormats
    const audioFormat =
      adaptiveFormats.find(f => f.url && f.mimeType?.includes('audio') && f.audioQuality === 'AUDIO_QUALITY_MEDIUM') ||
      adaptiveFormats.find(f => f.url && f.mimeType?.includes('audio')) ||
      null;

    if (videoFormats.length === 0) {
      console.error('API response:', JSON.stringify(apiResponse).substring(0, 500));
      return res.status(500).json({ error: 'No download URL found from API' });
    }

    console.log('Audio format:', audioFormat?.mimeType);
    console.log('Video quality candidates:', videoFormats.map(f => f.height + 'p').join(', '));

    // IMPORTANT: ffmpeg can't fetch googlevideo.com URLs directly anymore (403),
    // because it doesn't send browser-like headers and the URL is IP-locked.
    // So we download video (and audio) to local disk first, then run ffmpeg on local files.
    //
    // googlevideo.com throttles bandwidth hard for datacenter/server IPs (like Railway),
    // so a large 1080p file can take forever. We try each quality in order and fall back
    // to a smaller one if the download times out.
    let downloadedVideoFormat = null;
    let lastDownloadError = null;

    for (const candidate of videoFormats) {
      try {
        console.log(`Attempting download at ${candidate.height}p...`);
        await downloadFile(candidate.url, rawVideoFile, `video-${candidate.height}p`);
        downloadedVideoFormat = candidate;
        break; // success, stop trying lower qualities
      } catch (err) {
        console.warn(`${candidate.height}p download failed/timed out: ${err.message}`);
        lastDownloadError = err;
        fs.unlink(rawVideoFile, () => {}); // clean up partial file before next attempt
      }
    }

    if (!downloadedVideoFormat) {
      throw new Error(
        `Video download failed at all qualities (likely throttled by YouTube CDN for this server). Last error: ${lastDownloadError?.message}`
      );
    }

    if (audioFormat && audioFormat.url) {
      try {
        console.log('Downloading audio to local disk...');
        await downloadFile(audioFormat.url, rawAudioFile, 'audio');
      } catch (err) {
        console.warn('Audio download failed, continuing with video only:', err.message);
      }
    }

    const ffmpegCmd = (audioFormat && fs.existsSync(rawAudioFile))
      ? `ffmpeg -ss ${start} -i "${rawVideoFile}" -ss ${start} -i "${rawAudioFile}" -t ${duration} -map 0:v -map 1:a -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -vf scale=1080:-2 -avoid_negative_ts make_zero -threads 1 "${clipFile}" -y 2>&1`
      : `ffmpeg -ss ${start} -i "${rawVideoFile}" -t ${duration} -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -vf scale=1080:-2 -avoid_negative_ts make_zero -threads 1 "${clipFile}" -y 2>&1`;

    await new Promise((resolve, reject) => {
      exec(ffmpegCmd, { timeout: 120000, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        if (err) {
          console.error('FFmpeg error:', stderr || err.message);
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
    stream.on('end', () => {
      fs.unlink(clipFile, () => {});
      fs.unlink(rawVideoFile, () => {});
      fs.unlink(rawAudioFile, () => {});
    });
    stream.on('error', () => {
      fs.unlink(clipFile, () => {});
      fs.unlink(rawVideoFile, () => {});
      fs.unlink(rawAudioFile, () => {});
    });

  } catch (err) {
    console.error('Download error:', err.message);
    // cleanup on failure too
    fs.unlink(rawVideoFile, () => {});
    fs.unlink(rawAudioFile, () => {});
    fs.unlink(clipFile, () => {});
    if (!res.headersSent) {
      res.status(500).json({ error: 'Clip download failed', details: err.message });
    }
  }
});

// POST /api/clips/generate-title
router.post('/generate-title', async (req, res) => {
  try {
    const { videoData } = req.body;
    if (!videoData) {
      return res.status(400).json({ error: 'videoData required' });
    }
    const { generateTitleAndDescription } = require('../services/aiService');
    const result = await generateTitleAndDescription(videoData);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Title generation error:', error.message);
    res.status(500).json({ error: 'Title generation failed', message: error.message });
  }
});

module.exports = router;
