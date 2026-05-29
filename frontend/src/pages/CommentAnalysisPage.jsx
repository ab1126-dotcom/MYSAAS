import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  MessageSquare, Crown, Loader2, Play, TrendingUp, 
  Lightbulb, Users, AlertCircle, BarChart3, Zap, Copy
} from 'lucide-react';
import { analyzeComments, isPaidUser } from '../utils/api';

export default function CommentAnalysisPage() {
  const navigate = useNavigate();
  const paid = isPaidUser();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url.trim()) return toast.error('URL daalo!');
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await analyzeComments(url);
      setResult(data);
      toast.success('Comment analysis complete! 🎯');
    } catch (err) {
      if (err.status === 403) {
        setError({ type: 'upgrade' });
      } else {
        setError({ type: 'error', message: err.message });
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  if (!paid) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="glass-card p-12 border-yellow-500/20 bg-yellow-500/3">
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-6">
            <Crown size={36} className="text-yellow-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-4">
            Comment Analysis
            <span className="ml-2 text-lg bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/30">PRO</span>
          </h1>
          <p className="text-white/50 text-lg mb-6 leading-relaxed">
            Ye feature sirf <span className="text-yellow-400 font-semibold">Pro users</span> ke liye hai.
            <br />
            100 comments analyze karke AI batayega kaunsa video next banana chahiye!
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            {[
              '100+ comments analyze',
              'Audience sentiment check',
              'Top 3 next video ideas',
              'Comment ke patterns',
              'Audience kya chahti hai',
              'Content gaps find karo'
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/60 text-sm">
                <span className="text-yellow-400">✓</span>{f}
              </div>
            ))}
          </div>
          
          <button onClick={() => navigate('/pricing')} className="btn-primary px-10 py-4 text-lg">
            <Crown size={18} className="inline mr-2" />
            Pro Plan Upgrade Karo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-display font-bold text-white">
            Comment <span className="gradient-text">Analysis</span>
          </h1>
          <span className="bg-yellow-500/20 text-yellow-400 text-sm font-bold px-3 py-1 rounded-full border border-yellow-500/30">
            PRO
          </span>
        </div>
        <p className="text-white/40">Comments analyze karo — AI batayega next viral video idea</p>
      </div>

      {/* Input */}
      <form onSubmit={handleAnalyze} className="glass-card p-6 mb-8">
        <label className="block text-white/60 text-sm mb-3">YouTube Video URL (jis video ke comments analyze karne hain)</label>
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
          <button type="submit" className="btn-primary px-6 flex items-center gap-2" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {loading && (
          <div className="mt-3 text-purple-400 text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            100 comments padhe ja rahe hain... AI analyze kar raha hai...
          </div>
        )}
      </form>

      {/* Upgrade Error */}
      {error?.type === 'upgrade' && (
        <div className="glass-card p-6 mb-8 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3 mb-3">
            <Crown size={20} className="text-yellow-400" />
            <h3 className="font-bold text-yellow-300">Pro Plan Required</h3>
          </div>
          <p className="text-yellow-400/70 text-sm mb-3">Comment analysis ke liye Pro plan chahiye</p>
          <button onClick={() => navigate('/pricing')} className="btn-primary text-sm py-2">Upgrade Karo</button>
        </div>
      )}

      {error?.type === 'error' && (
        <div className="glass-card p-5 mb-8 border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error.message}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 fade-in-up">
          {/* Video Info */}
          <div className="glass-card p-5 flex gap-4 items-center">
            {result.videoData.thumbnail && (
              <img src={result.videoData.thumbnail} alt="" className="w-28 h-16 object-cover rounded-xl flex-shrink-0" />
            )}
            <div>
              <h2 className="font-bold text-white line-clamp-1">{result.videoData.title}</h2>
              <p className="text-white/40 text-sm">{result.videoData.channel}</p>
              <p className="text-brand-400 text-sm mt-1">
                <MessageSquare size={12} className="inline mr-1" />
                {result.commentsAnalyzed} comments analyzed
              </p>
            </div>
          </div>

          {/* Sentiment Analysis */}
          {result.analysis.sentimentAnalysis && (
            <div className="glass-card p-6">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-brand-400" />
                Audience Sentiment
              </h3>
              <div className="flex gap-3 mb-4">
                {[
                  { label: 'Positive', value: result.analysis.sentimentAnalysis.positive, color: 'bg-green-500' },
                  { label: 'Neutral', value: result.analysis.sentimentAnalysis.neutral, color: 'bg-yellow-500' },
                  { label: 'Negative', value: result.analysis.sentimentAnalysis.negative, color: 'bg-red-500' },
                ].map(s => (
                  <div key={s.label} className="flex-1 text-center">
                    <div className="h-2 rounded-full bg-dark-500 mb-2 overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.value}%` }} />
                    </div>
                    <div className="text-white font-bold">{s.value}%</div>
                    <div className="text-white/40 text-xs">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                  <p className="text-green-400 text-xs mb-1">👍 Audience Ko Kya Pasand Aaya</p>
                  <p className="text-white/70 text-sm">{result.analysis.sentimentAnalysis.topPositiveTheme}</p>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <p className="text-red-400 text-xs mb-1">👎 Kya Improve Karna Chahiye</p>
                  <p className="text-white/70 text-sm">{result.analysis.sentimentAnalysis.topNegativeTheme}</p>
                </div>
              </div>
            </div>
          )}

          {/* Audience Insights */}
          {result.analysis.audienceInsights && (
            <div className="glass-card p-6">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <Users size={18} className="text-purple-400" />
                Audience Insights
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-white/40 text-xs uppercase mb-2 tracking-wider">Audience Ki Requests</p>
                  <ul className="space-y-2">
                    {result.analysis.audienceInsights.requests?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                        <span className="text-brand-500 mt-0.5">→</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase mb-2 tracking-wider">Pain Points</p>
                  <ul className="space-y-2">
                    {result.analysis.audienceInsights.painPoints?.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                        <span className="text-red-400 mt-0.5">!</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Next Video Ideas */}
          {result.analysis.nextVideoIdeas && (
            <div>
              <h3 className="section-title mb-4 flex items-center gap-2">
                <Lightbulb size={18} className="text-yellow-400" />
                Next Video Ideas (AI Recommendations)
              </h3>
              <div className="space-y-4">
                {result.analysis.nextVideoIdeas.map((idea, i) => (
                  <div key={i} className="glass-card p-6 border-yellow-500/10 hover:border-yellow-500/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-yellow-400 font-mono text-sm">#{idea.rank}</span>
                          <h4 className="font-display font-bold text-white text-lg">{idea.title}</h4>
                        </div>
                        <p className="text-white/50 text-sm">{idea.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-green-400 font-bold text-sm">{idea.estimatedViews}</div>
                        <div className="text-white/30 text-xs">est. views</div>
                      </div>
                    </div>

                    {/* Hook */}
                    {idea.hook && (
                      <div className="bg-dark-700 rounded-xl p-3 mb-3 flex items-start gap-2 cursor-pointer group"
                           onClick={() => copyText(idea.hook)}>
                        <Zap size={13} className="text-orange-400 flex-shrink-0 mt-0.5" />
                        <p className="text-white/70 text-sm flex-1 italic">"{idea.hook}"</p>
                        <Copy size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
                      </div>
                    )}

                    {/* Outline */}
                    {idea.outline && (
                      <div className="mb-3">
                        <p className="text-white/30 text-xs uppercase mb-2">Video Outline</p>
                        <div className="flex flex-wrap gap-2">
                          {idea.outline.map((point, j) => (
                            <span key={j} className="text-xs bg-dark-600 text-white/60 px-2 py-1 rounded-lg">
                              {j+1}. {point}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evidence + Engagement */}
                    <div className="flex items-center gap-4 text-xs text-white/30">
                      <span>Based on: {idea.basedOn}</span>
                      <span className={`px-2 py-0.5 rounded-full border ${
                        idea.predictedEngagement === 'very high' ? 'text-green-400 border-green-500/30 bg-green-500/5' :
                        idea.predictedEngagement === 'high' ? 'text-blue-400 border-blue-500/30 bg-blue-500/5' :
                        'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
                      }`}>
                        {idea.predictedEngagement} engagement
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Insight */}
          {result.analysis.actionableInsight && (
            <div className="glass-card p-6 border-brand-500/20 bg-brand-500/3">
              <div className="flex items-start gap-3">
                <TrendingUp size={20} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-300 font-bold mb-1">🎯 Abhi Karo Ye:</p>
                  <p className="text-white/70">{result.analysis.actionableInsight}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
