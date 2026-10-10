import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home, LayoutDashboard, History, BookOpen, Info, ShieldCheck, Sun, Moon, ScanLine , LogOut, User as UserIcon} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import ScrollToTop from './ScrollToTop'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation();
  const { user, logout } = useAuth();

  // Theme logic
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  // Language logic
  const [language, setLanguage] = useState('EN')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    const handleEsc = (event) => {
      if (event.key === 'Escape') setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  
  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    document.documentElement.lang = lang.toLowerCase()
  }

  const links = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Learn', path: '/learn', icon: BookOpen },
    { name: 'About', path: '/about', icon: Info },
  ]

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3 mb-4 border-b border-white/5 pb-6">
        <div className="relative flex items-center justify-center text-classic-gold w-8 h-8 shrink-0">
          <svg className="w-full h-full stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <div className="absolute -bottom-1 -right-1 bg-classic-sidebar rounded-full p-[2px]">
            <ShieldCheck size={14} className="text-white stroke-[2.5]" />
          </div>
        </div>
        <div>
          <h1 className="font-display font-bold text-white leading-tight tracking-tight text-sm">Fake News &<br/>Scam Detector</h1>
          <p className="text-[10px] font-medium text-white/50 mt-0.5">See through the noise.</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 px-3">Menu</div>
        {links.map((link) => {
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                isActive ? "text-white bg-white/10 shadow-sm" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <link.icon size={18} className={cn(isActive ? "text-classic-gold" : "text-white/40 group-hover:text-white")} />
              <span className="relative z-10">{link.name}</span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-classic-gold rounded-r-full"></div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-start gap-3">
          <ShieldCheck size={20} className="text-classic-gold shrink-0" />
          <div>
            <div className="text-xs font-bold text-white mb-1">System Secure</div>
            <div className="text-[10px] text-white/50 font-medium">Engines operational</div>
          </div>
        </div>
      </div>
    </>
  )

  const getPageInfo = (path) => {
    if (path.startsWith('/result')) {
      return {
        title: "Analysis Report",
        eyebrow: "CONTENT ANALYSIS",
        subtitle: "Trust score, evidence, and recommended actions.",
        icon: ShieldCheck
      }
    }
    switch (path) {
      case '/':
        return {
          title: "Home",
          eyebrow: "INTELLIGENCE PLATFORM",
          subtitle: "Analyze messages, stories, and links.",
          icon: ScanLine
        }
      case '/dashboard':
        return {
          title: "Trust Intelligence",
          eyebrow: "ANALYTICS OVERVIEW",
          subtitle: "Understand your scan activity and detected risks.",
          icon: LayoutDashboard
        }
      case '/learn':
        return {
          title: "Scam Playbook",
          eyebrow: "SAFETY KNOWLEDGE",
          subtitle: "Learn to recognize common online scams.",
          icon: BookOpen
        }
      case '/about':
        return {
          title: "About the Project",
          eyebrow: "PROJECT OVERVIEW",
          subtitle: "How the detector works and why explainability matters.",
          icon: Info
        }
      default:
        return {
          title: "Intelligence Platform",
          eyebrow: "FAKE NEWS & SCAM DETECTOR",
          subtitle: "See through the noise.",
          icon: ShieldCheck
        }
    }
  }

  const pageInfo = getPageInfo(location.pathname)
  const PageIcon = pageInfo.icon

  return (
    <div className="min-h-screen flex bg-classic-pageBg font-sans selection:bg-classic-gold/30 transition-colors duration-500">
      <ScrollToTop />
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] fixed inset-y-0 left-0 bg-classic-sidebar border-r border-classic-border z-40 shadow-sm transition-colors duration-500">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-classic-sidebar/40 backdrop-blur-sm z-40 lg:hidden" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="fixed inset-y-0 left-0 w-[260px] bg-classic-sidebar border-r border-classic-border z-50 flex flex-col shadow-2xl lg:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px] transition-all duration-500">
        {/* Topbar */}
        <header className="min-h-[88px] py-4 bg-classic-surface border-b border-classic-border sticky top-0 z-30 flex flex-col justify-center px-4 sm:px-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-colors duration-500">
          <div className="flex items-center justify-between w-full gap-4">
            
            {/* Left: Branding & Titles */}
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
              <button 
                onClick={() => setMobileMenuOpen(true)} 
                className="lg:hidden text-classic-muted hover:text-classic-primary p-2 -ml-2 rounded-lg shrink-0"
                aria-label="Open mobile menu"
              >
                <Menu size={24} />
              </button>
              
              <div className="hidden sm:flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-classic-gold/10 dark:bg-white/5 border border-classic-gold/20 dark:border-white/10 text-classic-gold shrink-0 transition-colors">
                <PageIcon size={22} strokeWidth={1.75} />
              </div>

              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-classic-gold truncate">
                    {pageInfo.eyebrow}
                  </span>
                  <div className="hidden sm:block w-6 h-[1px] bg-classic-gold/30"></div>
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-classic-primary tracking-tight leading-none mb-1 sm:mb-1.5 truncate">
                  {pageInfo.title}
                </h2>
                <p className="text-[11px] sm:text-xs text-classic-secondary font-medium hidden md:block truncate max-w-md lg:max-w-xl">
                  {pageInfo.subtitle}
                </p>
              </div>
            </div>
            
            {/* Right: Theme Toggle & User Info */}
              <div className="flex items-center gap-3 sm:gap-4 justify-end shrink-0">
                {/* Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-classic-pageBg border border-classic-border text-classic-primary hover:border-classic-gold hover:text-classic-gold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-classic-gold/50 shadow-sm group"
                  title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
                  aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === 'dark' ? <Sun size={18} className="text-classic-gold group-hover:scale-110 transition-transform" /> : <Moon size={18} className="text-classic-primary group-hover:text-classic-gold group-hover:scale-110 transition-transform" />}
                </button>

                {user && (
                  <div className="relative" ref={profileRef}>
                    <button 
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 sm:gap-3 p-1 pr-2 sm:pr-3 rounded-full bg-classic-surfaceElevated border border-classic-border hover:border-classic-gold hover:bg-classic-surfaceElevated/80 transition-colors focus:outline-none focus:ring-2 focus:ring-classic-gold/50"
                      aria-expanded={profileOpen}
                      aria-haspopup="true"
                    >
                      <div className="w-8 h-8 rounded-full bg-classic-gold/10 flex items-center justify-center text-classic-gold border border-classic-gold/20 shrink-0">
                        {user.name ? <span className="text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span> : <UserIcon size={16} />}
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-xs font-bold text-classic-primary truncate max-w-[120px]">{user.name || user.email}</div>
                      </div>
                      <svg className={`hidden sm:block w-3 h-3 text-classic-secondary transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 bg-classic-surfaceElevated border border-classic-border rounded-xl shadow-lg z-50 overflow-hidden"
                        >
                          <div className="p-4 border-b border-classic-border/50 bg-classic-pageBg/50">
                            <p className="text-sm font-bold text-classic-primary truncate">{user.name || 'User'}</p>
                            <p className="text-xs text-classic-secondary truncate mt-0.5">{user.email}</p>
                          </div>
                          <div className="p-2">
                            <Link 
                              to="/dashboard" 
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-classic-primary hover:bg-classic-pageBg rounded-lg transition-colors"
                            >
                              <LayoutDashboard size={16} className="text-classic-muted" />
                              Dashboard
                            </Link>
                            <button 
                              onClick={() => { setProfileOpen(false); logout(); }}
                              className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-sm text-classic-dangerous hover:bg-classic-dangerous/10 rounded-lg transition-colors font-medium text-left"
                            >
                              <LogOut size={16} />
                              Sign out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full flex flex-col overflow-x-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
