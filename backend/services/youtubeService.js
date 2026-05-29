const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YT_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Extract video ID from various YouTube URL formats
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Get video details
async function getVideoDetails(videoId) {
  try {
    const response = await axios.get(`${YT_BASE_URL}/videos`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: videoId,
        key: YOUTUBE_API_KEY
      }
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = response.data.items[0];
    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      thumbnailUrl: video.snippet.thumbnails?.maxres?.url || 
                    video.snippet.thumbnails?.high?.url ||
                    video.snippet.thumbnails?.medium?.url,
      viewCount: parseInt(video.statistics.viewCount || 0),
      likeCount: parseInt(video.statistics.likeCount || 0),
      commentCount: parseInt(video.statistics.commentCount || 0),
      duration: video.contentDetails.duration,
      tags: video.snippet.tags || []
    };
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('YouTube API quota exceeded or invalid key');
    }
    throw new Error(`Failed to fetch video: ${error.message}`);
  }
}

// Get video comments
async function getVideoComments(videoId, maxResults = 100) {
  try {
    const response = await axios.get(`${YT_BASE_URL}/commentThreads`, {
      params: {
        part: 'snippet',
        videoId: videoId,
        maxResults: maxResults,
        order: 'relevance',
        key: YOUTUBE_API_KEY
      }
    });

    return response.data.items.map(item => ({
      id: item.id,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      replyCount: item.snippet.totalReplyCount,
      authorName: item.snippet.topLevelComment.snippet.authorDisplayName
    }));
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Comments disabled or API quota exceeded');
    }
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }
}

// Get channel videos for analysis
async function getChannelVideos(channelId, maxResults = 10) {
  try {
    // First get the uploads playlist
    const channelResponse = await axios.get(`${YT_BASE_URL}/channels`, {
      params: {
        part: 'contentDetails',
        id: channelId,
        key: YOUTUBE_API_KEY
      }
    });

    const uploadsPlaylistId = channelResponse.data.items[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) throw new Error('Channel not found');

    // Get recent videos from uploads playlist
    const playlistResponse = await axios.get(`${YT_BASE_URL}/playlistItems`, {
      params: {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: maxResults,
        key: YOUTUBE_API_KEY
      }
    });

    return playlistResponse.data.items.map(item => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.medium?.url
    }));
  } catch (error) {
    throw new Error(`Failed to fetch channel videos: ${error.message}`);
  }
}

// Parse ISO 8601 duration to seconds
function parseDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

module.exports = {
  extractVideoId,
  getVideoDetails,
  getVideoComments,
  getChannelVideos,
  parseDuration
};
