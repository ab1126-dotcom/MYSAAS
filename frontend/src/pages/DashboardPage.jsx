import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Search, Zap, Clock, Eye, ThumbsUp, MessageSquare, 
  TrendingUp, Copy, ChevronDown, ChevronUp, Tag, 
  AlertCircle, Crown, Loader2, Play, ExternalLink
} from 'lucide-react';
import { analyzeVideo, generateHooks, generateSEO, getUsage, isPaidUser, downloadClip } from '../utils/api';

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [url, setUrl] = useState(searchParams.get('url') || '');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState(null);
  const [expandedClip, setExpandedClip] = useState(null);
  const [clipDetails, setClipDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  const paid = isPaidUser();

  useEffect(() => {
    loadUsage();
    if (searchParams.get('url')) {
      handleAnalyze(null, searchParams.get('url'));
    }
  }, []);

  const loadUsage = async () => {
    try {
      const data = await getUsage();
      setUsage(data);
    } catch {}
  };

  const handleAnalyze = async (e, overrideUrl) => {
    if (e) e.preventDefault();
    const targetUrl = overrideUrl || url;
    if (!targetUrl.trim()) return toast.error('URL daalo pehle!');

    setLoading(true);
    setError(null);
    setResult(null);
    setClipDetails({});
    setExpandedClip(null);

    try {
      setLoadingStep('Video details fetch ho rahe hain...');
      await new Promise(r => setTimeout(r, 500));
      setLoadingStep('AI analyze kar raha hai...');
      await new Promise(r => setTimeout(r, 500));
      setLoadingStep('Viral moments dhundhe ja rahe hain...');
      
      const data = await analyzeVideo(targetUrl);
      setResult(data);
      setUsage(data.usage);
      toast.success(`${data.analysis.clips?.length || 0} viral clips mile! 🔥`);
      
    } catch (err) {
      if (err.upgradeRequired) {
        setError({ type: 'upgrade', message: err.message || JSON.stringify(err) });
      } else {
       setError({ type: 'error', message: err.message || JSON.stringify(err) });
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleGetHooks = async (clip) => {
    if (!result) return;
    const key = `hooks_${clip.id}`;
    setLoadingDetails(prev => ({ ...prev, [key]: true }));
    
    try {
      const data = await generateHooks(clip, result.videoData.title);
      setClipDetails(prev => ({ ...prev, [key]: data }));
      toast.success('Hooks ready hain! ✨');
    } catch (err) {
      toast.error('Hook generation failed: ' + err.message);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleGetSEO = async (clip) => {
    if (!result) return;
    const key = `seo_${clip.id}`;
    setLoadingDetails(prev => ({ ...prev, [key]: true }));
    
    try {
      const data = await generateSEO(result.videoData, clip);
      setClipDetails(prev => ({ ...prev, [key]: data }));
      toast.success('SEO package ready hai! 🎯');
    } catch (err) {
      toast.error('SEO generation failed: ' + err.message);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [key]: false }));
    }
  };

  const copyToClipboard = (text, label = 'Copied!') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Viral Clip <span className="gradient-text">Finder</span> 🎬
        </h1>
        <p className="text-white/40">YouTube link paste karo — AI viral clips dhundega</p>
      </div>

      {/* Usage Bar */}
      {usage && !paid && (
        <div className="glass-card p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Zap size={15} className="text-brand-400" />
            </div>
            <div>
              <div className="text-white text-sm font-medium">
                Free Clips: {usage.used}/{usage.limit} used
              </div>
              <div className="text-white/40 text-xs">
                {usage.remaining} remaining today
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-dark-500 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${(usage.used / 3) * 100}%` }}
              />
            </div>
            <button 
              onClick={() => navigate('/pricing')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium whitespace-nowrap"
            >
              Get Unlimited →
            </button>
          </div>
        </div>
      )}

      {paid && (
        <div className="glass-card p-4 mb-6 flex items-center gap-3 border-brand-500/20 bg-brand-500/5">
          <Crown size={18} className="text-brand-400" />
          <span className="text-brand-300 text-sm font-medium">Pro Plan Active — Unlimited Clips 🚀</span>
        </div>
      )}

      {/* URL Input */}
      <form onSubmit={handleAnalyze} className="glass-card p-6 mb-8">
        <label className="block text-white/60 text-sm mb-3">YouTube Video URL</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Play size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="input-field pl-10"
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary px-6 flex items-center gap-2 whitespace-nowrap"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
            ) : (
              <><Search size={16} /> Analyze</>
            )}
          </button>
        </div>
        {loading && (
          <div className="mt-3 flex items-center gap-2 text-brand-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            {loadingStep}
          </div>
        )}
      </form>

      {/* Error State */}
      {error && (
        <div className={`glass-card p-6 mb-8 ${error.type === 'upgrade' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <div className="flex items-start gap-4">
            {error.type === 'upgrade' ? (
              <Crown size={24} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-bold mb-1 ${error.type === 'upgrade' ? 'text-yellow-300' : 'text-red-300'}`}>
                {error.type === 'upgrade' ? 'Free Limit Khatam Ho Gaya! 🔒' : 'Error Aayi'}
              </h3>
              <p className={`text-sm ${error.type === 'upgrade' ? 'text-yellow-400/80' : 'text-red-400/80'}`}>
                {error.message}
              </p>
              {error.type === 'upgrade' && (
                <button onClick={() => navigate('/pricing')} className="mt-3 btn-primary text-sm py-2">
                  <Crown size={14} className="inline mr-2" />
                  Pro Plan Upgrade Karo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 fade-in-up">
          {/* Video Info Card */}
          <div className="glass-card p-6">
            <div className="flex gap-4">
              {result.videoData.thumbnail && (
                <img 
                  src={result.videoData.thumbnail} 
                  alt={result.videoData.title}
                  className="w-40 h-24 object-cover rounded-xl flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-white text-lg leading-tight mb-2 line-clamp-2">
                  {result.videoData.title}
                </h2>
                <p className="text-white/40 text-sm mb-3">{result.videoData.channel}</p>
                <div className="flex flex-wrap gap-4 text-sm text-white/50">
                  <span className="flex items-center gap-1.5"><Eye size={13} />{result.videoData.views} views</span>
                  <span className="flex items-center gap-1.5"><ThumbsUp size={13} />{result.videoData.likes} likes</span>
                  <span className="flex items-center gap-1.5"><MessageSquare size={13} />{result.videoData.comments} comments</span>
                  <span className="flex items-center gap-1.5"><Clock size={13} />{result.videoData.duration}</span>
                </div>
              </div>
              <a href={result.videoData.url} target="_blank" rel="noreferrer" 
                 className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors">
                <ExternalLink size={18} />
              </a>
            </div>
            
            {/* Overall Score */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-400" />
                <span className="text-white/60 text-sm">Overall Viral Potential:</span>
              </div>
              <span className={`viral-score-badge border ${getScoreColor(result.analysis.overallViralPotential)}`}>
                {result.analysis.overallViralPotential}/100
              </span>
              {result.analysis.summary && (
                <span className="text-white/40 text-sm italic">"{result.analysis.summary}"</span>
              )}
            </div>
          </div>

          {/* Clips */}
          <div>
            <h2 className="section-title mb-4 flex items-center gap-2">
              <span>🔥</span>
              Viral Clips ({result.analysis.clips?.length || 0} mila)
            </h2>

            <div className="space-y-4">
              {result.analysis.clips?.map((clip) => {
                const isExpanded = expandedClip === clip.id;
                const hooksData = clipDetails[`hooks_${clip.id}`];
                const seoData = clipDetails[`seo_${clip.id}`];
                const loadingHooks = loadingDetails[`hooks_${clip.id}`];
                const loadingSEO = loadingDetails[`seo_${clip.id}`];
                const isBest = result.analysis.bestClipId === clip.id;

                return (
                  <div key={clip.id} className={`glass-card overflow-hidden ${isBest ? 'border-brand-500/40 bg-brand-500/3' : ''}`}>
                    {/* Clip Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-dark-600 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <span className="font-mono font-bold text-white">{clip.id}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-display font-bold text-white">{clip.title}</h3>
                              {isBest && (
                                <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/30">
                                  ⭐ Best Clip
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-white/50 mb-2">
                              <span className="flex items-center gap-1 font-mono text-brand-400">
                                <Clock size={12} />
                                {clip.startTime} → {clip.endTime}
                              </span>
                              <span>{clip.duration}</span>
                              <span>~{clip.estimatedViews} views</span>
                            </div>
                            <p className="text-white/50 text-sm">{clip.reason}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`viral-score-badge border text-lg ${getScoreColor(clip.viralScore)}`}>
                            {clip.viralScore}
                          </span>
                          <div className="flex gap-1">
                            {clip.bestPlatforms?.map(p => (
                              <span key={p} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                p === 'TikTok' ? 'platform-tiktok' :
                                p === 'Instagram Reels' ? 'platform-instagram' :
                                'platform-youtube'
                              }`}>{p === 'Instagram Reels' ? 'IG Reels' : p}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quick Hook Preview */}
                      {clip.suggestedHook && (
                        <div className="mt-3 flex items-start gap-2 bg-dark-700 rounded-xl p-3 group cursor-pointer"
                             onClick={() => copyToClipboard(clip.suggestedHook, 'Hook copied!')}>
                          <Zap size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                          <p className="text-white/70 text-sm flex-1">{clip.suggestedHook}</p>
                          <Copy size={13} className="text-white/20 group-hover:text-white/50 flex-shrink-0 mt-0.5 transition-colors" />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button 
                          onClick={() => handleGetHooks(clip)}
                          disabled={loadingHooks}
                          className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                        >
                          {loadingHooks ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                          {hooksData ? 'Hooks Reload' : 'Hooks Generate'}
                        </button>
                        <button 
                          onClick={() => handleGetSEO(clip)}
                          disabled={loadingSEO}
                          className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                        >
                          {loadingSEO ? <Loader2 size={13} className="animate-spin" /> : <Tag size={13} />}
                          {seoData ? 'SEO Reload' : 'SEO Generate'}
                        </button>
                        <button
                          onClick={() => downloadClip(result.videoData.url, clip.startTime, clip.endTime, clip.title)}
                          className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                        >
                          ⬇️ Download Clip
                        </button>
                        {(hooksData || seoData) && (
                          <button 
                            onClick={() => setExpandedClip(isExpanded ? null : clip.id)}
                            className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 px-3 py-2"
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {isExpanded ? 'Collapse' : 'Details Dekho'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-white/5 p-5 space-y-6 bg-dark-800/50">
                        
                        {/* Hooks Section */}
                        {hooksData?.hooks && (
                          <div>
                            <h4 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                              <Zap size={15} className="text-orange-400" />
                              Viral Hooks ({hooksData.hooks.length})
                            </h4>
                            <div className="space-y-2">
                              {hooksData.hooks.map((hook, i) => (
                                <div key={i} 
                                     className={`glass-card p-3 flex items-start gap-3 group cursor-pointer hover:border-brand-500/20 ${i === hooksData.bestHook ? 'border-orange-500/30 bg-orange-500/5' : ''}`}
                                     onClick={() => copyToClipboard(hook.text, 'Hook copied!')}>
                                  <span className="text-xl">{hook.emoji}</span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-white/40 font-medium uppercase tracking-wider">{hook.type}</span>
                                      {i === hooksData.bestHook && <span className="text-xs text-orange-400">⭐ Best</span>}
                                      <span className="text-xs text-white/30 ml-auto">{hook.platform}</span>
                                    </div>
                                    <p className="text-white/80 text-sm">{hook.text}</p>
                                  </div>
                                  <Copy size={13} className="text-white/20 group-hover:text-white/50 mt-1 flex-shrink-0 transition-colors" />
                                </div>
                              ))}
                            </div>
                            {hooksData.tips && (
                              <div className="mt-3 space-y-1">
                                {hooksData.tips.map((tip, i) => (
                                  <p key={i} className="text-white/40 text-xs flex items-start gap-2">
                                    <span className="text-brand-500">→</span>{tip}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* SEO Section */}
                        {seoData?.seo && (
                          <div>
                            <h4 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                              <Tag size={15} className="text-blue-400" />
                              SEO Package
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 ml-auto">
                                Score: {seoData.seo.seoScore}/100
                              </span>
                            </h4>

                            {/* Titles */}
                            <div className="mb-4">
                              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Optimized Titles</p>
                              <div className="space-y-2">
                                {seoData.seo.optimizedTitles?.map((t, i) => (
                                  <div key={i} className="flex items-center gap-3 glass-card p-3 cursor-pointer group hover:border-blue-500/20"
                                       onClick={() => copyToClipboard(t.title, 'Title copied!')}>
                                    <span className="text-blue-400 font-bold text-sm">{t.score}</span>
                                    <span className="text-white/80 text-sm flex-1">{t.title}</span>
                                    <Copy size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Hashtags */}
                            {seoData.seo.hashtags && (
                              <div className="mb-4">
                                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Hashtags</p>
                                <div className="space-y-2">
                                  {Object.entries(seoData.seo.hashtags).map(([platform, tags]) => (
                                    <div key={platform} className="flex items-start gap-2">
                                      <span className={`text-xs font-medium w-20 flex-shrink-0 py-1 ${
                                        platform === 'tiktok' ? 'text-[#69C9D0]' : 
                                        platform === 'instagram' ? 'text-pink-400' : 'text-red-400'
                                      }`}>{platform.charAt(0).toUpperCase() + platform.slice(1)}:</span>
                                      <div className="flex flex-wrap gap-1 cursor-pointer group"
                                           onClick={() => copyToClipboard(tags.join(' '), 'Hashtags copied!')}>
                                        {tags.map((tag, i) => (
                                          <span key={i} className="text-xs bg-dark-600 text-white/60 px-2 py-1 rounded-lg">
                                            {tag}
                                          </span>
                                        ))}
                                        <Copy size={12} className="text-white/20 group-hover:text-white/50 mt-1 transition-colors" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Best Posting Time */}
                            {seoData.seo.bestPostingTime && (
                              <div className="glass-card p-3 flex items-center gap-3">
                                <Clock size={14} className="text-green-400" />
                                <span className="text-white/60 text-sm">Best Posting Time:</span>
                                <span className="text-green-400 text-sm font-medium">{seoData.seo.bestPostingTime}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upgrade Prompt */}
          {!paid && (
            <div className="glass-card p-6 text-center border-yellow-500/20 bg-yellow-500/3">
              <Crown size={32} className="text-yellow-400 mx-auto mb-3" />
              <h3 className="font-display font-bold text-white text-xl mb-2">
                More Clips Chahiye? Pro Upgrade Karo! 🚀
              </h3>
              <p className="text-white/50 mb-4">
                Unlimited clips, more analysis, aur comment analysis feature sab milega
              </p>
              <button onClick={() => navigate('/pricing')} className="btn-primary px-8">
                Pro Plan Dekho →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
