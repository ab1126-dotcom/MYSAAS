const NodeCache = require('node-cache');

// In-memory cache for tracking usage (in production use Redis/DB)
const usageCache = new NodeCache({ stdTTL: 86400 }); // 24 hour TTL

const FREE_CLIP_LIMIT = 3;

// Get user identifier (IP based for demo, use auth token in production)
function getUserId(req) {
  return req.headers['x-user-id'] || 
         req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         'anonymous';
}

// Check free tier usage
function checkFreeUsage(req, res, next) {
  const isPaid = req.headers['x-subscription'] === 'paid' || 
                 req.body?.isPaid === true ||
                 req.query?.isPaid === 'true';
  
  req.isPaid = isPaid;
  
  if (isPaid) {
    return next(); // Paid users unlimited
  }

  const userId = getUserId(req);
  const key = `usage_${userId}`;
  const usage = usageCache.get(key) || 0;

  req.currentUsage = usage;
  req.remainingFree = Math.max(0, FREE_CLIP_LIMIT - usage);

  if (usage >= FREE_CLIP_LIMIT) {
    return res.status(403).json({
      error: 'Free limit reached',
      message: `Aapne apne ${FREE_CLIP_LIMIT} free clips use kar liye hain. Unlimited clips ke liye upgrade karein!`,
      limit: FREE_CLIP_LIMIT,
      used: usage,
      remaining: 0,
      upgradeRequired: true
    });
  }

  next();
}

// Increment usage after successful clip generation
function incrementUsage(req) {
  if (req.isPaid) return;
  
  const userId = getUserId(req);
  const key = `usage_${userId}`;
  const current = usageCache.get(key) || 0;
  usageCache.set(key, current + 1);
}

// Get usage stats for a user
function getUsageStats(req) {
  const userId = getUserId(req);
  const key = `usage_${userId}`;
  const used = usageCache.get(key) || 0;
  const isPaid = req.headers['x-subscription'] === 'paid';
  
  return {
    userId,
    isPaid,
    used,
    limit: isPaid ? 'unlimited' : FREE_CLIP_LIMIT,
    remaining: isPaid ? 'unlimited' : Math.max(0, FREE_CLIP_LIMIT - used)
  };
}

module.exports = { checkFreeUsage, incrementUsage, getUsageStats, getUserId };
