import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, MessageSquare, Tag, Scissors, X } from 'lucide-react';
import { setSubscription, isPaidUser } from '../utils/api';
import toast from 'react-hot-toast';

export default function PricingPage() {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const currentPaid = isPaidUser();

  const handleSelectPlan = (plan) => {
    if (plan === 'paid') {
      window.location.href = 'https://clipai-pro.lemonsqueezy.com/checkout/buy/ea447515-83e5-4fe2-9318-11cd85576dcb';
    } else {
      setSubscription('free');
      toast.success('Free Plan selected');
      navigate('/dashboard');
    }
  };

  const monthlyPrice = 499;
  const yearlyPrice = Math.round(monthlyPrice * 12 * 0.6);

  const freePlan = {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    icon: Scissors,
    iconColor: 'text-white',
    iconBg: 'bg-dark-500',
    borderColor: 'border-white/10',
    features: [
      { text: '3 viral clips per day', included: true },
      { text: 'AI hook suggestions', included: true },
      { text: 'Basic SEO package', included: true },
      { text: 'YouTube & TikTok analysis', included: true },
      { text: 'Unlimited clips', included: false },
      { text: 'Comment analysis', included: false },
      { text: 'Next video AI suggestions', included: false },
      { text: 'Priority processing', included: false },
    ],
    cta: currentPaid ? 'Downgrade to Free' : 'Current Plan',
    planKey: 'free'
  };

  const proPlan = {
    name: 'Pro',
    price: isYearly ? `₹${Math.round(yearlyPrice / 12)}` : `₹${monthlyPrice}`,
    period: isYearly ? '/month (billed yearly)' : '/month',
    totalYearly: isYearly ? `₹${yearlyPrice}/year` : null,
    icon: Crown,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/20',
    borderColor: 'border-brand-500/40',
    badge: isYearly ? '40% OFF' : 'Most Popular',
    features: [
      { text: 'Unlimited viral clips', included: true, highlight: true },
      { text: 'Advanced AI hook generator', included: true },
      { text: 'Complete SEO package', included: true },
      { text: 'All platforms (TikTok, IG, YT)', included: true },
      { text: 'Comment analysis (100 comments)', included: true, highlight: true },
      { text: 'Next video AI suggestions', included: true, highlight: true },
      { text: 'Priority AI processing', included: true },
      { text: 'Batch video analysis', included: true },
    ],
    cta: currentPaid ? 'Current Plan ✓' : 'Get Pro Now',
    planKey: 'paid'
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 text-sm text-yellow-400 mb-6">
          <Crown size={13} />
          Pricing Plans
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
          Apna Plan <span className="gradient-text">Choose Karo</span>
        </h1>
        <p className="text-white/40 text-lg">Shuru karo free mein, badhao jab zaroorat ho</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <span className={`text-sm font-medium ${!isYearly ? 'text-white' : 'text-white/40'}`}>Monthly</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className={`w-14 h-7 rounded-full relative transition-all duration-300 ${isYearly ? 'bg-brand-500' : 'bg-dark-500 border border-white/20'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 ${isYearly ? 'left-8' : 'left-1'}`} />
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isYearly ? 'text-white' : 'text-white/40'}`}>Yearly</span>
          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30 font-bold">
            40% OFF
          </span>
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-6 mb-16">
        {[freePlan, proPlan].map((plan) => (
          <div key={plan.name} className={`glass-card p-8 relative overflow-hidden border ${plan.borderColor} ${plan.name === 'Pro' ? 'bg-brand-500/3' : ''}`}>
            {plan.badge && (
              <div className="absolute top-4 right-4 bg-brand-500/20 text-brand-400 text-xs font-bold px-3 py-1 rounded-full border border-brand-500/30">
                {plan.badge}
              </div>
            )}
            
            <div className={`w-12 h-12 ${plan.iconBg} rounded-xl flex items-center justify-center mb-5`}>
              <plan.icon size={22} className={plan.iconColor} />
            </div>
            
            <h2 className="text-2xl font-display font-bold text-white mb-1">{plan.name}</h2>
            
            <div className="mb-2">
              <span className="text-4xl font-display font-bold text-white">{plan.price}</span>
              <span className="text-white/40 ml-1">{plan.period}</span>
            </div>
            {plan.totalYearly && (
              <p className="text-brand-400 text-sm mb-5">{plan.totalYearly}</p>
            )}
            
            <ul className="space-y-3 my-6">
              {plan.features.map((feature) => (
                <li key={feature.text} className={`flex items-center gap-3 text-sm ${feature.included ? '' : 'opacity-40'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    feature.included ? 'bg-green-500/20 text-green-400' : 'bg-dark-500 text-white/30'
                  }`}>
                    {feature.included ? <Check size={11} /> : <X size={11} />}
                  </div>
                  <span className={`${feature.highlight ? 'text-white font-medium' : 'text-white/60'}`}>
                    {feature.text}
                    {feature.highlight && <span className="ml-2 text-xs text-brand-400">★</span>}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan.planKey)}
              disabled={plan.name === 'Free' && !currentPaid || plan.name === 'Pro' && currentPaid}
              className={`w-full py-3 rounded-xl font-semibold text-base transition-all duration-200 ${
                plan.name === 'Pro' 
                  ? 'btn-primary' 
                  : 'btn-secondary'
              } ${(plan.name === 'Free' && !currentPaid || plan.name === 'Pro' && currentPaid) ? 'opacity-60 cursor-default' : ''}`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Features Comparison */}
      <div className="glass-card p-6 mb-12">
        <h3 className="section-title mb-6 text-center">Feature Comparison 📊</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/50 font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-white/70 font-medium">Free</th>
                <th className="text-center py-3 px-4 text-brand-400 font-medium">Pro ⭐</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Daily Clips', '3/day', 'Unlimited'],
                ['Video Analysis', '✓', '✓'],
                ['AI Hook Generator', '1 style', '5 styles'],
                ['SEO Package', 'Basic', 'Complete'],
                ['Platform Support', 'TikTok + YT', 'All Platforms'],
                ['Comment Analysis', '✗', '100 comments'],
                ['Next Video Ideas', '✗', 'AI-powered'],
                ['Processing Speed', 'Normal', 'Priority'],
                ['Batch Analysis', '✗', '✓'],
              ].map(([feature, free, pro]) => (
                <tr key={feature} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-4 text-white/60">{feature}</td>
                  <td className="py-3 px-4 text-center text-white/50">{free}</td>
                  <td className="py-3 px-4 text-center text-green-400 font-medium">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h3 className="section-title mb-6 text-center">Aksar Pooche Jaate Hain 🙋</h3>
        <div className="space-y-4">
          {[
            {
              q: 'Free plan mein sirf 3 clips hain?',
              a: 'Haan! Free mein per day 3 viral clips analyze kar sakte ho. Pro mein unlimited hain.'
            },
            {
              q: 'Payment secure hai?',
              a: 'Bilkul! Hum Lemon Squeezy use karte hain jo secure international payment gateway hai. Card payments sab chalega.'
            },
            {
              q: 'YouTube API ke bina kaam karega?',
              a: 'Backend ko YouTube Data API v3 key chahiye. Google Cloud Console se free mein mil jati hai.'
            },
            {
              q: 'Clips directly download hoti hain?',
              a: 'ClipAI timestamps aur analysis deta hai. Actual clip cutting ke liye CapCut ya DaVinci Resolve use karo — hum exact timecode dete hain!'
            },
            {
              q: 'Cancel kar sakte hain?',
              a: 'Kisi bhi waqt cancel kar sakte ho. Remaining period ka pura access milega.'
            },
          ].map((faq) => (
            <div key={faq.q} className="glass-card p-5">
              <h4 className="font-medium text-white mb-2 flex items-start gap-2">
                <span className="text-brand-500 font-bold text-lg leading-none mt-0.5">Q</span>
                {faq.q}
              </h4>
              <p className="text-white/50 text-sm leading-relaxed ml-5">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Secure Payment Note */}
      <div className="mt-10 glass-card p-5 border-green-500/20 bg-green-500/5">
        <p className="text-green-400/80 text-sm text-center">
          ✅ <strong>Secure Payment:</strong> "Get Pro Now" button Lemon Squeezy secure checkout pe redirect karta hai. PKR 499/month — kabhi bhi cancel kar sakte ho.
        </p>
      </div>
    </div>
  );
}
