const { createClient } = require('redis');

const FREE_CLIP_LIMIT = 3;

let redisClient = null;

async function getRedis() {
  if (redisClient) return redisClient;
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => console.error('Redis error:', err));
  await redisClient.connect();
  return redisClient;
}

function getUserId(req) {
  return req.headers['x-user-id'] || 
         req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         'anonymous';
}

async function checkFreeUsage(req, res, next) {
  const isPaid = req.headers['x-subscription'] === 'paid' || 
                 req.body?.isPaid === true ||
                 req.query?.isPaid === 'true';
  
  req.isPaid = isPaid;
  if (isPaid) return next();

  const userId = getUserId(req);
  const key = `usage_${userId}`;

  try {
    const redis = await getRedis();
    const usage = parseInt(await redis.get(key) || '0');
    req.currentUsage = usage;
    req.remainingFree = Math.max(0, FREE_CLIP_LIMIT - usage);

    if (usage >= FREE_CLIP_LIMIT) {
      return res.status(403).json({
        error: 'Free limit reached',
        message: `You have used all ${FREE_CLIP_LIMIT} free clips. Upgrade for unlimited!`,
        limit: FREE_CLIP_LIMIT,
        used: usage,
        remaining: 0,
        upgradeRequired: true
      });
    }
    next();
  } catch (err) {
    console.error('Redis checkFreeUsage error:', err.message);
    next(); // fail open
  }
}

async function incrementUsage(req) {
  if (req.isPaid) return;
  const userId = getUserId(req);
  const key = `usage_${userId}`;
  try {
    const redis = await getRedis();
    await redis.incr(key);
    await redis.expire(key, 86400); // 24 hour TTL
  } catch (err) {
    console.error('Redis incrementUsage error:', err.message);
  }
}

async function getUsageStats(req) {
  const userId = getUserId(req);
  const key = `usage_${userId}`;
  const isPaid = req.headers['x-subscription'] === 'paid';
  
  try {
    const redis = await getRedis();
    const used = parseInt(await redis.get(key) || '0');
    return {
      userId,
      isPaid,
      used,
      limit: isPaid ? 'unlimited' : FREE_CLIP_LIMIT,
      remaining: isPaid ? 'unlimited' : Math.max(0, FREE_CLIP_LIMIT - used)
    };
  } catch (err) {
    return { userId, isPaid, used: 0, limit: FREE_CLIP_LIMIT, remaining: FREE_CLIP_LIMIT };
  }
}

module.exports = { checkFreeUsage, incrementUsage, getUsageStats, getUserId };

module.exports = { checkFreeUsage, incrementUsage, getUsageStats, getUserId };
