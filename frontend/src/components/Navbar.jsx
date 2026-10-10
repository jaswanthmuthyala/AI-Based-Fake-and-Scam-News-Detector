import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Menu, X, ShieldCheck } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Learn', path: '/learn' },
    { name: 'About', path: '/about' },
  ]

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
      scrolled ? "py-2" : "py-4"
    )}>
      <div className={cn(
        "mx-auto px-4 sm:px-6 transition-all duration-500",
        scrolled ? "max-w-5xl" : "max-w-7xl"
      )}>
        <nav className={cn(
          "flex items-center justify-between transition-all duration-500 relative rounded-2xl",
          scrolled ? "bg-white/90 backdrop-blur-xl border border-classic-border px-6 py-2 shadow-sm" : "bg-transparent px-2"
        )}>
          
          <Link to="/" className="flex items-center gap-3 group relative z-20">
            <div className="relative flex items-center justify-center text-classic-gold w-8 h-8">
              <svg className="w-full h-full stroke-[2] transition-transform duration-500 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px]">
                <ShieldCheck size={14} className="text-classic-navy stroke-[2.5]" />
              </div>
            </div>
            <span className="font-display font-semibold text-lg text-classic-navy hidden sm:block tracking-tight">
              Fake News <span className="font-normal text-classic-muted text-sm mx-1">&amp;</span> Scam Detector
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2 relative z-20">
            {links.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium transition-colors duration-300 rounded-lg",
                    isActive ? "text-classic-navy" : "text-classic-muted hover:text-classic-navy hover:bg-black/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-classic-navy/5 rounded-lg border border-classic-navy/10"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-4 relative z-20">
            <div className="flex items-center gap-1 bg-classic-ivory border border-classic-border rounded-lg p-1">
              <button className="px-2 py-1 text-xs font-bold rounded shadow-sm bg-white text-classic-navy">EN</button>
              <button className="px-2 py-1 text-xs font-medium rounded text-classic-muted hover:text-classic-navy">HI</button>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-classic-navy p-2 relative z-20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <motion.div 
        initial={false}
        animate={{ height: mobileMenuOpen ? 'auto' : 0, opacity: mobileMenuOpen ? 1 : 0 }}
        className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-b border-classic-border shadow-md"
      >
        <div className="px-6 py-6 flex flex-col gap-4">
          {links.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "text-base font-medium px-4 py-3 rounded-lg",
                location.pathname === link.path ? "bg-classic-navy/5 text-classic-navy" : "text-classic-muted"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </motion.div>
    </header>
  )
}
