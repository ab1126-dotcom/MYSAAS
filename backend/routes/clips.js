const express = require('express');
const router = express.Router();
const { generateHooks, generateSEO } = require('../services/aiService');
const { exec, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const http = require('http');

const TMP_DIR = '/tmp/clips';
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const BROWSER_HEADERS = 'Referer: https://www.youtube.com/\r\nOrigin: https://www.youtube.com\r\n';

// Total time we allow for a fallback full-file download before giving up (ms)
const DOWNLOAD_HARD_TIMEOUT = 90000; // 90 seconds
// Time we allow the fast direct-stream ffmpeg trim to run before giving up (ms)
const DIRECT_STREAM_TIMEOUT = 45000; // 45 seconds

// ---------------------------------------------------------------------------
// PRIMARY METHOD: ask ffmpeg to read straight from the googlevideo URL and
// only pull the bytes it actually needs for the requested time range (via
// HTTP range requests done internally by ffmpeg's demuxer). This avoids
// downloading the entire (often 300-600+ MB) source video just to cut out a
// 10-30 second clip, which is what was previously causing multi-minute hangs.
// ---------------------------------------------------------------------------
function directStreamClip(videoUrl, audioUrl, start, duration, clipFile) {
  return new Promise((resolve, reject) => {
    const args = ['-y'];

    // Video input, with fast (input-level) seek + browser-like headers
    args.push('-user_agent', BROWSER_UA, '-headers', BROWSER_HEADERS, '-ss', String(start), '-i', videoUrl);

    // Optional audio input
    if (audioUrl) {
      args.push('-user_agent', BROWSER_UA, '-headers', BROWSER_HEADERS, '-ss', String(start), '-i', audioUrl);
    }

    args.push('-t', String(duration));

    if (audioUrl) {
      args.push('-map', '0:v', '-map', '1:a');
    } else {
      args.push('-map', '0:v');
    }

    args.push(
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
      ...(audioUrl ? ['-c:a', 'aac', '-b:a', '128k'] : []),
      '-vf', 'scale=1080:-2',
      '-avoid_negative_ts', 'make_zero',
      '-threads', '1',
      clipFile
    );

    execFile('ffmpeg', args, { timeout: DIRECT_STREAM_TIMEOUT, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
      } else if (!fs.existsSync(clipFile) || fs.statSync(clipFile).size === 0) {
        reject(new Error('ffmpeg produced no output (direct stream)'));
      } else {
        resolve();
      }
    });
  });
}

// ---------------------------------------------------------------------------
// FALLBACK METHOD: download the full file to disk first, then trim locally.
// Slower and can fail on very large files over limited bandwidth, but kept as
// a safety net in case direct streaming isn't supported for a given format.
// ---------------------------------------------------------------------------
function downloadFile(url, destPath, label = 'file', maxRedirects = 10) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) return reject(new Error('Too many redirects'));

    const lib = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    let settled = false;
    let downloadedBytes = 0;
    let totalBytes = 0;
    let lastLogTime = Date.now();

    const hardTimeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      request.destroy();
      file.close();
      fs.unlink(destPath, () => {});
      reject(new Error(`${label} download exceeded ${DOWNLOAD_HARD_TIMEOUT / 1000}s`));
    }, DOWNLOAD_HARD_TIMEOUT);

    const cleanupAndSettle = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimeout);
      fn(arg);
    };

    const request = lib.get(url, {
      headers: {
        'User-Agent': BROWSER_UA,
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
      console.log(`${label}: starting fallback full download, size ~${(totalBytes / 1024 / 1024).toFixed(1)} MB`);

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const now = Date.now();
        if (now - lastLogTime > 5000) {
          const pct = totalBytes ? ((downloadedBytes / totalBytes) * 100).toFixed(1) : '?';
          console.log(`${label}: ${(downloadedBytes / 1024 / 1024).toFixed(1)} MB downloaded (${pct}%)`);
          lastLogTime = now;
        }
      });

      response.pipe(file);
      file.on('finish', () => { file.close(); cleanupAndSettle(resolve); });
      file.on('error', (err) => { fs.unlink(destPath, () => {}); cleanupAndSettle(reject, err); });
    });

    request.on('error', (err) => {
      fs.unlink(destPath, () => {});
      cleanupAndSettle(reject, err);
    });
  });
}

function runFfmpegOnLocalFiles(rawVideoFile, rawAudioFile, start, duration, clipFile) {
  const hasAudio = fs.existsSync(rawAudioFile);
  const ffmpegCmd = hasAudio
    ? `ffmpeg -ss ${start} -i "${rawVideoFile}" -ss ${start} -i "${rawAudioFile}" -t ${duration} -map 0:v -map 1:a -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -vf scale=1080:-2 -avoid_negative_ts make_zero -threads 1 "${clipFile}" -y 2>&1`
    : `ffmpeg -ss ${start} -i "${rawVideoFile}" -t ${duration} -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -vf scale=1080:-2 -avoid_negative_ts make_zero -threads 1 "${clipFile}" -y 2>&1`;

  return new Promise((resolve, reject) => {
    exec(ffmpegCmd, { timeout: 120000, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve();
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

    const videoCandidates = [
      adaptiveFormats.find(f => f.url && f.mimeType?.includes('video/mp4') && f.height === 1080),
      adaptiveFormats.find(f => f.url && f.mimeType?.includes('video/mp4') && f.height === 720),
      adaptiveFormats.find(f => f.url && f.mimeType?.includes('video/mp4') && f.height === 480),
      adaptiveFormats.find(f => f.url && f.mimeType?.includes('video/mp4') && f.height === 360),
    ].filter(Boolean);

    const seen = new Set();
    const videoFormats = videoCandidates.filter(f => {
      if (seen.has(f.url)) return false;
      seen.add(f.url);
      return true;
    });

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

    let clipReady = false;
    let lastError = null;

    // --- Attempt 1 (per quality): fast direct-stream trim, no full download ---
    for (const candidate of videoFormats) {
      try {
        console.log(`Direct-stream attempt at ${candidate.height}p...`);
        await directStreamClip(candidate.url, audioFormat?.url || null, start, duration, clipFile);
        console.log(`Direct-stream succeeded at ${candidate.height}p`);
        clipReady = true;
        break;
      } catch (err) {
        console.warn(`Direct-stream failed at ${candidate.height}p: ${err.message}`);
        lastError = err;
        fs.unlink(clipFile, () => {});
      }
    }

    // --- Attempt 2 (fallback): full download then trim locally ---
    if (!clipReady) {
      console.log('Falling back to full-file download method...');
      for (const candidate of videoFormats) {
        try {
          console.log(`Fallback full download at ${candidate.height}p...`);
          await downloadFile(candidate.url, rawVideoFile, `video-${candidate.height}p`);
          if (audioFormat?.url) {
            try {
              await downloadFile(audioFormat.url, rawAudioFile, 'audio');
            } catch (audioErr) {
              console.warn('Audio fallback download failed, continuing video-only:', audioErr.message);
            }
          }
          await runFfmpegOnLocalFiles(rawVideoFile, rawAudioFile, start, duration, clipFile);
          if (fs.existsSync(clipFile)) {
            clipReady = true;
            break;
          }
        } catch (err) {
          console.warn(`Fallback failed at ${candidate.height}p: ${err.message}`);
          lastError = err;
          fs.unlink(rawVideoFile, () => {});
          fs.unlink(rawAudioFile, () => {});
          fs.unlink(clipFile, () => {});
        }
      }
    }

    if (!clipReady) {
      throw new Error(`Clip could not be generated at any quality. Last error: ${lastError?.message}`);
    }

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
