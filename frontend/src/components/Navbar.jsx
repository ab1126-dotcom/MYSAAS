import { Link, useLocation } from 'react-router-dom';
import { Scissors, Zap, MessageSquare, DollarSign } from 'lucide-react';
import { isPaidUser } from '../utils/api';

export default function Navbar() {
  const location = useLocation();
  const paid = isPaidUser();

  const navLinks = [
    { to: '/dashboard', label: 'Clip Finder', icon: Scissors },
    { to: '/comments', label: 'Comment AI', icon: MessageSquare, paidOnly: true },
    { to: '/pricing', label: 'Pricing', icon: DollarSign },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center glow-red">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl">
            Clip<span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon, paidOnly }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === to
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              {label}
              {paidOnly && !paid && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full border border-yellow-500/30">
                  Pro
                </span>
              )}
              {paidOnly && paid && (
                <span className="text-xs bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full border border-brand-500/30">
                  ✓
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {paid ? (
            <span className="flex items-center gap-2 text-sm text-brand-400 bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/30">
              <Zap size={13} fill="currentColor" />
              Pro Active
            </span>
          ) : (
            <Link to="/pricing" className="btn-primary text-sm py-2">
              Upgrade Pro
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
