import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, AlertCircle, Loader2, Sparkles, History, Search, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '../lib/utils';
export default function Login({ isRegister = false }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isRegister && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
        await login(email, password);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-classic-pageBg selection:bg-classic-gold/30 transition-colors duration-500">
      
      {/* LEFT SIDE - Branding & Info */}
      <div className="hidden lg:flex flex-col w-[45%] bg-classic-sidebar border-r border-classic-border relative overflow-hidden">
        
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-classic-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-classic-gold/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-classic-gold/10 border border-classic-gold/20 text-classic-gold shrink-0">
              <ShieldCheck size={24} strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-tight tracking-tight">Fake News &<br/>Scam Detector</h1>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="font-display font-bold text-4xl xl:text-5xl text-white mb-6 leading-[1.1]">
              See through <br />
              <span className="text-classic-gold">the noise.</span>
            </h2>
            <p className="text-white/70 text-lg mb-12 max-w-md leading-relaxed">
              Verify suspicious messages, investigate news, and inspect links with explainable AI.
            </p>

            <div className="space-y-6 max-w-md">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-classic-gold shrink-0">
                  <Search size={16} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-sm">Hybrid AI Detection</h3>
                  <p className="text-white/50 text-xs leading-relaxed">Cross-references rules, machine learning, and metadata in real-time.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-classic-gold shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-sm">Explainable Risk Signals</h3>
                  <p className="text-white/50 text-xs leading-relaxed">Understand exactly why content was flagged with highlighted phrase analysis.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-classic-gold shrink-0">
                  <History size={16} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-sm">Private Scan History</h3>
                  <p className="text-white/50 text-xs leading-relaxed">Keep a secure, personal dashboard of everything you've investigated.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-xs text-white/30 font-medium">
            &copy; {new Date().getFullYear()} Trust Intelligence Platform.
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 z-20">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-classic-surfaceElevated border border-classic-border text-classic-primary hover:border-classic-gold hover:text-classic-gold transition-all duration-300 shadow-sm"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        
        {/* Mobile Logo Fallback */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-classic-surfaceElevated border border-classic-border text-classic-gold shrink-0 shadow-sm">
            <ShieldCheck size={20} strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-display font-bold text-classic-primary text-base leading-tight tracking-tight">Fake News &<br/>Scam Detector</h1>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-classic-primary tracking-tight">
              {isRegister ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="mt-3 text-sm text-classic-secondary">
              {isRegister ? 'Or ' : 'Don\'t have an account? '}
              <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-classic-gold hover:text-classic-gold/80 transition-colors">
                {isRegister ? 'sign in to your account' : 'sign up here'}
              </Link>
            </p>
          </div>

          <div className="bg-classic-surfaceElevated py-8 px-6 sm:px-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-classic-border rounded-2xl">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-classic-dangerous/10 border border-classic-dangerous/20 rounded-xl p-4 flex items-start gap-3 text-classic-dangerous">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-classic-primary mb-1.5">Full Name</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-classic-muted" />
                    </div>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-classic pl-10 bg-classic-surface" placeholder="Jane Doe" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-classic-primary mb-1.5">Email address</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-classic-muted" />
                  </div>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-classic pl-10 bg-classic-surface" placeholder="you@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-classic-primary mb-1.5">Password</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-classic-muted" />
                  </div>
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="input-classic pl-10 pr-10 bg-classic-surface" placeholder="••••••••" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-classic-muted hover:text-classic-gold focus:outline-none focus:text-classic-gold transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-classic-primary mb-1.5">Confirm Password</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-classic-muted" />
                    </div>
                    <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-classic pl-10 pr-10 bg-classic-surface" placeholder="••••••••" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-classic-muted hover:text-classic-gold focus:outline-none focus:text-classic-gold transition-colors"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                  </div>
                </div>
              )}

              {!isRegister && (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-classic-border text-classic-gold focus:ring-classic-gold/50 bg-classic-surface" />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-classic-secondary">Remember me</label>
                  </div>
                  <div className="text-sm">
                    {/* Placeholder for future forgot password logic */}
                    <a href="#" className="font-medium text-classic-gold hover:text-classic-gold/80 transition-colors" onClick={(e) => e.preventDefault()}>Forgot password?</a>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full flex justify-center btn-primary relative py-2.5 text-sm">
                  {loading ? <Loader2 size={18} className="animate-spin text-classic-navy" /> : (isRegister ? 'Create Account' : 'Sign In')}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
