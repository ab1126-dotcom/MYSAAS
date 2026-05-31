import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-6 text-sm text-white/40">
        <span>© 2026 ClipAI</span>
        <Link to="/privacy-policy" className="hover:text-white/70 transition-colors">
          Privacy Policy
        </Link>
        <Link to="/terms-of-service" className="hover:text-white/70 transition-colors">
          Terms of Service
        </Link>
        <a href="mailto:bj4136048@gmail.com" className="hover:text-white/70 transition-colors">
          Contact
        </a>
      </div>
    </footer>
  );
}
