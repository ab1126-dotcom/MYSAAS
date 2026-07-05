const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Analyze video and find viral clip moments
async function findViralClips(videoData, clipCount = 3) {
  const prompt = `
Tu ek expert viral content analyzer hai jo YouTube aur streaming content ko analyze karta hai.

VIDEO INFORMATION:
Title: ${videoData.title}
Channel: ${videoData.channelTitle}
Duration: ${videoData.duration} seconds
Views: ${videoData.viewCount}
Likes: ${videoData.likeCount}
Description: ${videoData.description?.substring(0, 500)}
Tags: ${videoData.tags?.join(', ')}

TASK: Is video ke ${clipCount} BEST viral clips identify kar. Har clip ke liye:
1. Exact timestamp range do (start - end)
2. Viral potential score (1-100)
3. Kyun viral hoga (reason)
4. Kaunse platform ke liye best hai (TikTok/Instagram Reels/YouTube Shorts)
5. Hook jo is clip ke saath use karna chahiye

Respond ONLY in this exact JSON format:
{
  "clips": [
    {
      "id": 1,
      "startTime": "2:30",
      "endTime": "3:15",
      "startSeconds": 150,
      "endSeconds": 195,
      "duration": "45 seconds",
      "viralScore": 87,
      "title": "Clip ka catchy title",
      "reason": "Yahan kuch bahut interesting/funny/shocking hua",
      "bestPlatforms": ["TikTok", "Instagram Reels"],
      "suggestedHook": "Yahan hook text likho...",
      "category": "funny|educational|emotional|shocking|inspiring",
      "estimatedViews": "50K-200K"
    }
  ],
  "overallViralPotential": 75,
  "bestClipId": 1,
  "summary": "Video ke baare mein ek line summary"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI response parse karne mein error');
  
  return JSON.parse(jsonMatch[0]);
}

// Generate viral hooks for a clip
async function generateHooks(clipData, videoTitle) {
  const prompt = `
Tu ek viral content hook writer hai. Tera kaam attention-grabbing hooks likhna hai.

VIDEO: ${videoTitle}
CLIP ABOUT: ${clipData.reason}
CLIP CATEGORY: ${clipData.category}
PLATFORM: ${clipData.bestPlatforms?.join(', ')}

5 different viral hooks generate kar is clip ke liye. Alag alag styles mein:
1. Question Hook
2. Shocking Statement Hook  
3. "You won't believe" style Hook
4. Curiosity Gap Hook
5. Emotional/Relatable Hook

Respond ONLY in this JSON format:
{
  "hooks": [
    {
      "type": "Question",
      "text": "Hook text yahan...",
      "emoji": "🔥",
      "platform": "TikTok",
      "viralScore": 85
    }
  ],
  "bestHook": 0,
  "tips": ["tip 1", "tip 2"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Hook generation error');
  
  return JSON.parse(jsonMatch[0]);
}

// Generate SEO optimization
async function generateSEO(videoData, clipData) {
  const prompt = `
Tu ek YouTube SEO expert hai. Is viral clip ke liye complete SEO package generate kar.

VIDEO TITLE: ${videoData.title}
CLIP ABOUT: ${clipData.reason || clipData.title}
CATEGORY: ${clipData.category}
PLATFORMS: ${clipData.bestPlatforms?.join(', ')}
CURRENT TAGS: ${videoData.tags?.slice(0, 10).join(', ')}

Complete SEO package do:

Respond ONLY in this JSON format:
{
  "optimizedTitles": [
    {"title": "Title option 1", "score": 90},
    {"title": "Title option 2", "score": 85},
    {"title": "Title option 3", "score": 80}
  ],
  "description": "Full optimized description with keywords...",
  "hashtags": {
    "tiktok": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
    "instagram": ["#tag1", "#tag2"],
    "youtube": ["#tag1", "#tag2"]
  },
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "bestPostingTime": "Tuesday-Thursday 6PM-9PM",
  "thumbnailTips": ["tip1", "tip2", "tip3"],
  "seoScore": 82,
  "improvements": ["improvement1", "improvement2"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('SEO generation error');
  
  return JSON.parse(jsonMatch[0]);
}

// Analyze comments and suggest next video (PAID feature)
async function analyzeCommentsForNextVideo(videoData, comments) {
  const commentsText = comments
    .slice(0, 50)
    .map(c => `[${c.likeCount} likes] ${c.text}`)
    .join('\n');

  const prompt = `
Tu ek YouTube audience analyst aur content strategist hai.

VIDEO: ${videoData.title}
CHANNEL: ${videoData.channelTitle}
VIEWS: ${videoData.viewCount}
TOTAL COMMENTS ANALYZED: ${comments.length}

TOP COMMENTS:
${commentsText}

Deeply analyze karo aur batao:
1. Audience kya chahti hai next video mein
2. Kya topics trending hain comments mein
3. Kya complaints ya suggestions hain
4. Audience ki demographics aur mood
5. Next 3 video ideas with full strategy

Respond ONLY in this JSON format:
{
  "audienceInsights": {
    "mood": "excited|disappointed|curious|confused|satisfied",
    "mainTopics": ["topic1", "topic2", "topic3"],
    "painPoints": ["point1", "point2"],
    "requests": ["request1", "request2", "request3"],
    "engagementLevel": "high|medium|low",
    "audienceType": "description of audience"
  },
  "sentimentAnalysis": {
    "positive": 65,
    "neutral": 25,
    "negative": 10,
    "topPositiveTheme": "...",
    "topNegativeTheme": "..."
  },
  "nextVideoIdeas": [
    {
      "rank": 1,
      "title": "Suggested video title",
      "description": "Why this will perform well",
      "estimatedViews": "100K-500K",
      "basedOn": "Comment evidence for this idea",
      "hook": "Opening hook for this video",
      "outline": ["Point 1", "Point 2", "Point 3"],
      "bestThumbnailConcept": "Thumbnail idea",
      "predictedEngagement": "very high|high|medium"
    }
  ],
  "contentGaps": ["What competitor videos you should make"],
  "seriesOpportunity": "Is video se series bana sakte ho",
  "urgencyScore": 85,
  "actionableInsight": "Most important thing to do right now"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Comment analysis error');
  
  return JSON.parse(jsonMatch[0]);
}
// Generate Title & Description using Gemma 4 (Google)
async function generateTitleAndDescription(videoData) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a YouTube SEO expert. Based on this video info, generate 5 catchy titles and 1 SEO-optimized description.

Video Title: ${videoData.title}
Channel: ${videoData.channelTitle}
Views: ${videoData.viewCount}
Description: ${videoData.description?.substring(0, 300)}

Respond ONLY with raw JSON. Do not include any explanation, reasoning, or markdown code fences. Do not think out loud. Your entire output must be exactly this JSON object and nothing else:
{
  "titles": [
    {"title": "Title 1", "score": 95},
    {"title": "Title 2", "score": 90},
    {"title": "Title 3", "score": 85},
    {"title": "Title 4", "score": 80},
    {"title": "Title 5", "score": 75}
  ],
  "description": "Full SEO optimized description here with keywords...",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "bestTitleIndex": 0
}`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    }
  );

  const data = await response.json();

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('Gemma 4 raw response (no text):', JSON.stringify(data));
    const apiErrorMsg = data?.error?.message;
    throw new Error(apiErrorMsg ? `Gemma 4 error: ${apiErrorMsg}` : 'Gemma 4 response error');
  }

  // Strip markdown code fences if present (```json ... ```)
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Gemma 4 raw text that failed to match JSON:', text);
    throw new Error('Gemma 4 parse error');
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    console.error('Gemma 4 text that failed JSON.parse:', jsonMatch[0]);
    throw new Error('Gemma 4 parse error');
  }
}
module.exports = {
  findViralClips,
  generateHooks,
  generateSEO,
  analyzeCommentsForNextVideo,
generateTitleAndDescription
};
