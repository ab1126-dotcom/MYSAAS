import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Scissors, TrendingUp, MessageSquare, Search, Star, ChevronRight, Play } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');

  const handleQuickAnalyze = (e) => {
    e.preventDefault();
    if (url.trim()) {
      navigate(`/dashboard?url=${encodeURIComponent(url.trim())}`);
    }
  };

  const features = [
    {
      icon: Scissors,
      title: 'Viral Clip Finder',
      desc: 'AI automatically detects the most viral moments in your video',
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
      border: 'border-brand-500/20',
      free: true
    },
    {
      icon: Zap,
      title: 'Hook Generator',
      desc: '5 different viral hook styles for each clip — question, shocking, curiosity gap',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      free: true
    },
    {
      icon: Search,
      title: 'SEO Package',
      desc: 'Optimized titles, hashtags, description & posting time for each clip',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      free: true
    },
    {
      icon: MessageSquare,
      title: 'Comment Analysis',
      desc: 'Analyze 100 comments & get AI-powered ideas for your next viral video',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      free: false
    },
  ];

  const stats = [
    { value: '10M+', label: 'Clips Analyzed' },
    { value: '85%', label: 'Accuracy Rate' },
    { value: '3x', label: 'More Views' },
    { value: '50K+', label: 'Creators' },
  ];

  const testimonials = [
    { name: 'Bhuvan Bam', handle: '@bb_ki_vines', text: 'This tool helped my clip reach 2M views! The AI is incredibly accurate 🔥', avatar: 'BB' },
    { name: 'CarryMinati', handle: '@carryminati', text: 'Comment analysis feature is a total game changer. Got my next video idea instantly!', avatar: 'CM' },
    { name: 'MrBeast India', handle: '@mrbeastindia', text: 'Tried 3 free clips, then upgraded immediately. Worth every penny!', avatar: 'MB' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-orange-500/6 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-full px-4 py-2 text-sm text-brand-400 mb-8 fade-in-up">
          <Zap size={13} fill="currentColor" />
          AI-Powered Viral Clip Detection
          <span className="bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full text-xs">NEW</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight mb-6 fade-in-up animate-delay-100">
          Extract
          <br />
          <span className="gradient-text">Viral Clips</span> From
          <br />
          YouTube With AI! 🚀
        </h1>

        <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 fade-in-up animate-delay-200 font-body">
          Just paste a link — AI will find your best moments, write viral hooks, 
          optimize SEO and tell you what video to make next!
        </p>

        {/* Quick URL Input */}
        <form onSubmit={handleQuickAnalyze} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6 fade-in-up animate-delay-300">
          <div className="flex-1 relative">
            <Play size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste your YouTube link here..."
              className="input-field pl-11 py-4 text-base"
            />
          </div>
          <button type="submit" className="btn-primary px-8 py-4 text-base whitespace-nowrap flex items-center gap-2">
            <Zap size={16} />
            Analyze Now
          </button>
        </form>

        <p className="text-white/30 text-sm fade-in-up animate-delay-400">
          ✓ Try 3 clips for free — No credit card needed
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 fade-in-up animate-delay-500">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-5">
              <div className="text-3xl font-display font-bold gradient-text">{stat.value}</div>
              <div className="text-white/40 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-display font-bold text-white mb-4">
            What You Get 🎯
          </h2>
          <p className="text-white/40 text-lg">Everything in one place — to become a viral creator</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className={`glass-card-hover p-6 relative overflow-hidden`}>
              {!f.free && (
                <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full border border-yellow-500/30">
                  PRO ONLY
                </div>
              )}
              {f.free && (
                <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full border border-green-500/30">
                  FREE
                </div>
              )}
              <div className={`w-12 h-12 ${f.bg} border ${f.border} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon size={22} className={f.color} />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">{f.title}</h3>
              <p className="text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-6xl mx-auto px-4 py-20 border-t border-white/5">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-display font-bold text-white mb-4">How It Works 🤔</h2>
          <p className="text-white/40 text-lg">Viral clips ready in just 3 steps!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Paste Your Link', desc: 'Paste your YouTube video link — any video, any length', icon: '🔗' },
            { step: '02', title: 'AI Analyzes It', desc: 'Our AI analyzes the video and finds the most viral moments', icon: '🤖' },
            { step: '03', title: 'Download Your Clips', desc: 'Timestamps, hooks, SEO all ready — just use them in your clip editor!', icon: '🎬' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-5xl mb-4">{item.icon}</div>
              <div className="text-brand-500 font-mono text-sm mb-2">{item.step}</div>
              <h3 className="text-xl font-display font-bold text-white mb-3">{item.title}</h3>
              <p className="text-white/40 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-display font-bold text-white mb-4">What Creators Are Saying ⭐</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.handle} className="glass-card p-6">
              <div className="flex items-center gap-1 text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-white/70 mb-5 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{t.name}</div>
                  <div className="text-white/40 text-xs">{t.handle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="glass-card p-12 relative overflow-hidden border-brand-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent" />
          <div className="relative">
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Ready? 🔥<br />Try It Free Right Now!
            </h2>
            <p className="text-white/50 text-lg mb-8">3 clips completely free — no signup, no credit card</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
              <Zap size={18} />
              Start Analyzing
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-white/30 text-sm">
        <p>© 2025 ClipAI — Made with ❤️ for Creators</p>
      </footer>
    </div>
  );
}

