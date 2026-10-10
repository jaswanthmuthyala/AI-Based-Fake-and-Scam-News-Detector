import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, AlertTriangle, Search, MousePointerClick, BookOpen, Smartphone, CreditCard, Building, Network, FileText, Globe, Brain } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'

export default function Learn() {
  const [activeHotspot, setActiveHotspot] = useState(null)

  const topics = [
    { title: 'KYC & Banking Scams', icon: Building, desc: 'Impersonating banks to steal credentials.', flags: ['Urgent account suspension', 'Links to fake portals', 'Requesting PAN/Aadhaar'], action: 'Never click links in SMS. Use official banking apps.' },
    { title: 'OTP Phishing', icon: Smartphone, desc: 'Tricking victims into sharing one-time passwords.', flags: ['"Do not share" text included to build false trust', 'Claims of refunds or upgrades'], action: 'Never share OTPs. Banks never ask for them over phone.' },
    { title: 'Fake Prizes & Lottery', icon: CreditCard, desc: 'Promising large sums of money for a small fee.', flags: ['You won without entering', 'Processing/customs fees required'], action: 'If you have to pay to claim a prize, it is a scam.' },
    { title: 'Health Hoaxes', icon: Network, desc: 'Dangerous medical misinformation.', flags: ['"Miracle cure"', '100% proven claims with no source'], action: 'Consult real medical professionals. Do not substitute medicine.' },
    { title: 'Job Offer Fraud', icon: FileText, desc: 'Fake recruitment demanding processing fees.', flags: ['Unsolicited WhatsApp job offers', 'Immediate hiring'], action: 'Legitimate employers never ask you to pay for a job.' },
    { title: 'URL Lookalikes', icon: Globe, desc: 'Domains designed to mimic trusted brands.', flags: ['Missing HTTPS', 'Strange TLDs (.xyz, .top)'], action: 'Always inspect the domain name carefully before logging in.' }
  ]

  const interactiveMessage = [
    { text: "Dear Customer, ", isRisk: false },
    { text: "your SBI account will be BLOCKED today. ", isRisk: true, engine: "Rule Heuristics", reason: "Creates artificial pressure to bypass critical thinking." },
    { text: "Please update your PAN card immediately by clicking here: ", isRisk: false },
    { text: "http://sbi-kyc-verify-update.xyz ", isRisk: true, engine: "Link Intelligence", reason: "Uses HTTP and a strange TLD (.xyz) disguised with bank keywords." },
    { text: "Do not share OTP with anyone.", isRisk: true, engine: "ML Classifier", reason: "Mimics official bank security warnings to build false trust." }
  ]

  return (
    <div className="w-full bg-classic-background min-h-screen pb-24 text-classic-primary relative pt-24">
      <div className="absolute inset-0 bg-grid-architectural opacity-50 pointer-events-none"></div>

      {/* Editorial Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center mb-16 border-b border-classic-border pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-classic-surfaceElevated border border-blue-100 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 text-classic-primary">
          <BookOpen size={14} className="text-classic-gold"/> Education Center
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-bold text-classic-primary mb-6 tracking-tight">
          The Scam Playbook
        </h1>
        <p className="text-lg text-classic-muted max-w-2xl mx-auto font-medium leading-relaxed">
          Recognize the patterns before they become problems. Understand the sophisticated social engineering tactics used in modern deception.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        
        {/* Interactive Scam Lab */}
        <div className="classic-card bg-classic-surface mb-20 relative overflow-hidden flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-classic-gold">
              Interactive Lab
            </div>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-classic-primary mb-6">Spot the red flags.</h2>
            <p className="text-classic-primary mb-8 font-medium leading-relaxed">
              Click on the highlighted sections of the message to see exactly what the AI detector notices. This is how explainable intelligence works.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-classic-background p-3 rounded-lg border border-classic-border">
                <div className="w-8 h-8 rounded-full bg-classic-surface flex items-center justify-center text-classic-dangerous shadow-sm"><AlertTriangle size={14}/></div>
                <span className="text-sm font-bold text-classic-primary">Identifies false urgency</span>
              </div>
              <div className="flex items-center gap-3 bg-classic-background p-3 rounded-lg border border-classic-border">
                <div className="w-8 h-8 rounded-full bg-classic-surface flex items-center justify-center text-classic-suspicious shadow-sm"><Globe size={14}/></div>
                <span className="text-sm font-bold text-classic-primary">Inspects URLs & TLDs</span>
              </div>
              <div className="flex items-center gap-3 bg-classic-background p-3 rounded-lg border border-classic-border">
                <div className="w-8 h-8 rounded-full bg-classic-surface flex items-center justify-center text-classic-safe shadow-sm"><Brain size={14}/></div>
                <span className="text-sm font-bold text-classic-primary">Maps Social Engineering</span>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2 flex justify-center">
            <div className="bg-classic-background w-full max-w-md rounded-3xl p-4 sm:p-6 shadow-sm border border-classic-border relative font-sans text-[15px] leading-relaxed">
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-classic-navy text-classic-surface rounded-full flex items-center justify-center shadow-lg animate-[float_3s_ease-in-out_infinite] cursor-pointer z-30">
                <MousePointerClick size={20} />
              </div>
              
              {/* Fake Message */}
              <div className="bg-classic-surface rounded-xl p-5 shadow-sm border border-classic-border relative">
                {interactiveMessage.map((part, i) => (
                  part.isRisk ? (
                    <span 
                      key={i} 
                      onClick={() => setActiveHotspot(activeHotspot === i ? null : i)}
                      className={cn(
                        "cursor-pointer px-1 rounded transition-colors duration-300 relative inline-block mx-0.5 border-b-2",
                        activeHotspot === i ? "bg-classic-dangerous/10 border-classic-dangerous text-classic-primary shadow-sm" : "bg-classic-surfaceElevated border-classic-border hover:border-classic-gold hover:text-classic-gold transition-all"
                      )}
                    >
                      {part.text}
                      <AnimatePresence>
                        {activeHotspot === i && (
                          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-classic-navy text-classic-surface text-xs rounded-xl shadow-xl z-40 text-left">
                            <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
                              <span className="font-bold text-classic-gold uppercase tracking-widest text-[9px] flex items-center gap-1"><Search size={10}/> AI Insight</span>
                              <span className="font-bold text-classic-muted uppercase tracking-widest text-[9px]">{part.engine}</span>
                            </div>
                            <div className="font-medium text-[13px] leading-relaxed">{part.reason}</div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-classic-navy"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </span>
                  ) : <span key={i} className="text-classic-primary">{part.text}</span>
                ))}
                <div className="text-[10px] text-classic-muted text-right mt-3 font-medium">Today 10:42 AM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Cards Grid */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-classic-primary mb-4">Common Threat Profiles</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, i) => (
            <div key={i} className="classic-card flex flex-col h-full group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-classic-surfaceElevated text-classic-primary rounded-xl flex items-center justify-center border border-blue-100 group-hover:bg-classic-navy group-hover:text-classic-surface transition-colors">
                  <topic.icon size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold font-display text-classic-primary mb-3">{topic.title}</h3>
              <p className="text-classic-primary text-sm font-medium leading-relaxed mb-6 flex-1">{topic.desc}</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-classic-muted mb-2">Red Flags</h4>
                  <ul className="space-y-1">
                    {topic.flags.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-classic-primary font-medium">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5 text-classic-suspicious" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t border-classic-border">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-classic-safe mb-1 flex items-center gap-1"><ShieldCheck size={12}/> Recommended Action</h4>
                  <p className="text-xs font-bold text-classic-primary leading-relaxed">{topic.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  )
}
