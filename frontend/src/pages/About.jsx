import { Brain, Search, ShieldCheck, Link2, Code, Database, Server, Cpu, Globe, Lock, GitBranch } from 'lucide-react'

export default function About() {
  const stack = [
    { name: 'React & Vite', icon: Code, desc: 'Frontend Architecture' },
    { name: 'Tailwind CSS v4', icon: Globe, desc: 'Design System' },
    { name: 'FastAPI (Python)', icon: Server, desc: 'Backend Engine' },
    { name: 'Scikit-learn', icon: Brain, desc: 'Machine Learning' },
    { name: 'SQLite', icon: Database, desc: 'History Storage' },
    { name: 'Tesseract', icon: Search, desc: 'Image OCR processing' },
  ]

  return (
    <div className="w-full bg-classic-background min-h-screen text-classic-primary pb-24 relative pt-24">
      <div className="absolute inset-0 bg-grid-architectural opacity-50 pointer-events-none"></div>

      {/* Editorial Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center mb-24 border-b border-classic-border pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-classic-surfaceElevated border border-blue-100 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 text-classic-primary">
          <ShieldCheck size={14} /> Mission & Architecture
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-bold text-classic-primary mb-6 tracking-tight max-w-4xl mx-auto leading-tight">
          Intelligence you can <span className="italic font-light">trust.</span>
        </h1>
        <p className="text-lg text-classic-muted max-w-2xl mx-auto font-medium leading-relaxed">
          TrustEngine is a research initiative designed to fight digital deception through explainable artificial intelligence.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        
        {/* Mission Statement Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24 items-center">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-classic-gold mb-4 flex items-center gap-2"><Globe size={16}/> The Problem</h2>
            <h3 className="text-3xl lg:text-4xl font-display font-bold text-classic-primary mb-6 tracking-tight">Democratizing digital safety.</h3>
            <p className="text-classic-primary mb-4 font-medium leading-relaxed text-lg">
              As phishing attempts, health hoaxes, and social engineering scams become increasingly sophisticated, it is no longer enough to rely on basic keyword blockers.
            </p>
            <p className="text-classic-primary font-medium leading-relaxed text-lg">
              Our mission is to provide an accessible, hybrid analysis engine that doesn't just tell you a message is dangerous—it explains <span className="italic font-bold text-classic-primary">why</span>, empowering users to recognize patterns in the future.
            </p>
          </div>
          
          <div className="classic-card bg-classic-surface flex items-center justify-center p-8 lg:p-12 h-full min-h-[300px]">
            {/* Architecture Diagram Abstraction */}
            <div className="relative w-full max-w-md z-10">
              <div className="flex justify-between items-center mb-10">
                <div className="w-16 h-16 bg-classic-surfaceElevated rounded-full flex items-center justify-center text-classic-primary shadow-sm"><Search size={24}/></div>
                <div className="flex-1 h-px bg-classic-border mx-2 relative overflow-hidden"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-classic-navy animate-[float_2s_linear_infinite]"></div></div>
                <div className="w-20 h-20 bg-classic-navy rounded-full border-4 border-classic-ivory flex items-center justify-center text-classic-surface shadow-md z-10"><Brain size={32}/></div>
                <div className="flex-1 h-px bg-classic-border mx-2 relative overflow-hidden"><div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-classic-safe animate-[float_2s_linear_infinite_1s]"></div></div>
                <div className="w-16 h-16 bg-classic-safe/10 rounded-full flex items-center justify-center text-classic-safe shadow-sm"><ShieldCheck size={24}/></div>
              </div>
              <div className="text-center font-bold text-[10px] text-classic-muted uppercase tracking-widest flex justify-between px-2">
                <span>Input</span>
                <span className="text-classic-primary">Hybrid Fusion</span>
                <span>Verdict</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hybrid Engine Section */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-classic-primary mb-3">Technology</h2>
            <h3 className="text-3xl lg:text-4xl font-display font-bold text-classic-primary">The Hybrid Analysis Engine</h3>
            <p className="text-classic-primary font-medium max-w-2xl mx-auto mt-4">Three distinct analytical systems running in parallel, fused together for high-confidence detection.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="classic-card text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-classic-surfaceElevated text-classic-primary flex items-center justify-center mb-6"><GitBranch size={24}/></div>
              <h4 className="font-bold text-lg text-classic-primary mb-3">Rule Heuristics</h4>
              <p className="text-sm text-classic-primary font-medium leading-relaxed">Detects structured structural patterns like urgent payment requests, KYC deadlines, and lottery promises.</p>
            </div>
            <div className="classic-card text-center flex flex-col items-center border-classic-navy border-2 relative shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-classic-navy text-classic-surface text-[9px] font-bold uppercase tracking-widest py-1 px-3 rounded-full">Core Engine</div>
              <div className="w-14 h-14 rounded-full bg-classic-navy text-classic-surface flex items-center justify-center mb-6"><Cpu size={24}/></div>
              <h4 className="font-bold text-lg text-classic-primary mb-3">Machine Learning</h4>
              <p className="text-sm text-classic-primary font-medium leading-relaxed">A custom-trained TF-IDF classifier evaluating linguistic intent, sentiment, and deep deception markers.</p>
            </div>
            <div className="classic-card text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-classic-surfaceElevated text-classic-primary flex items-center justify-center mb-6"><Link2 size={24}/></div>
              <h4 className="font-bold text-lg text-classic-primary mb-3">Link Intelligence</h4>
              <p className="text-sm text-classic-primary font-medium leading-relaxed">Inspects domains for missing HTTPS, suspicious TLDs, and lookalike brand impersonation directly.</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-classic-muted mb-6">Built with Modern Technology</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stack.map((tech, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-5 bg-classic-surface border border-classic-border rounded-xl text-center shadow-sm">
                <tech.icon size={24} className="text-classic-muted mb-3" />
                <div className="text-xs font-bold text-classic-primary mb-1">{tech.name}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-classic-muted">{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Banner */}
        <div className="bg-classic-surfaceElevated rounded-[2rem] p-10 md:p-16 text-center text-classic-primary relative overflow-hidden shadow-lg border border-classic-border">
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-classic-surface shadow-sm border border-classic-border rounded-full flex items-center justify-center mb-6 text-classic-gold">
              <Lock size={28} />
            </div>
            <h2 className="text-3xl font-display font-bold mb-6">Privacy by Design</h2>
            <p className="text-classic-secondary mb-10 leading-relaxed font-medium text-lg">
              Your data is yours. Analyzed text is never stored unless you explicitly choose to save it to your dashboard. When saving, automatic masking algorithms strip out sensitive information like phone numbers.
            </p>
            <button className="btn-primary">
              View Privacy Policy
            </button>
          </div>
        </div>
        
      </div>
    </div>
  )
}
