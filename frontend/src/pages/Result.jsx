import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { ShieldCheck, AlertTriangle, ShieldAlert, ArrowLeft, Copy, Flag, CheckCircle2, ChevronRight, Activity, Brain, Globe, FileText, Search, Link as LinkIcon, Lock, Info, Server } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

export default function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result
  
  const [copied, setCopied] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  
  if (!result) return <Navigate to="/" replace />

  const { trust_score, verdict, category, original_text, highlights, explanation, advice, breakdown, secondary_categories = [], claims_requiring_verification = [], verification_status = '' } = result

  const toastTimeoutRef = useRef(null)
  
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const showToast = (msg) => {
    setToastMsg(msg)
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg('')
      toastTimeoutRef.current = null
    }, 3000)
  }

  const copyReport = () => {
    const text = `TrustEngine Analysis\nVerdict: ${verdict}\nScore: ${trust_score}/100\nCategory: ${category}\n\nExplanation:\n${explanation}`
    navigator.clipboard.writeText(text)
    showToast('Analysis report copied to clipboard')
  }

  const vConfig = {
    Safe: { color: 'text-classic-safe', border: 'border-classic-safe/30', bg: 'bg-classic-safe/10', icon: ShieldCheck, hex: '#2F7D5B' },
    Suspicious: { color: 'text-classic-suspicious', border: 'border-classic-suspicious/30', bg: 'bg-classic-suspicious/10', icon: AlertTriangle, hex: '#C98A1B' },
    Dangerous: { color: 'text-classic-dangerous', border: 'border-classic-dangerous/30', bg: 'bg-classic-dangerous/10', icon: ShieldAlert, hex: '#A63A3A' },
  }
  const currV = vConfig[verdict] || vConfig.Suspicious
  const Icon = currV.icon

  const data = [
    { name: 'Score', value: trust_score },
    { name: 'Remaining', value: 100 - trust_score },
  ]

  const isUrlOnly = breakdown.links.weight === 100

  const renderHighlightedText = () => {
    if (!highlights || highlights.length === 0) return <p className="leading-relaxed">{original_text}</p>
    let parts = [{ text: original_text, isHighlight: false, reason: null }];
    
    [...highlights].sort((a, b) => b.phrase.length - a.phrase.length).forEach(h => {
      let newParts = []
      parts.forEach(part => {
        if (part.isHighlight) newParts.push(part)
        else {
          const split = part.text.split(new RegExp(`(${h.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
          split.forEach(s => {
            if (s.toLowerCase() === h.phrase.toLowerCase()) {
              newParts.push({ text: s, isHighlight: true, reason: h.reason })
            } else if (s) {
              newParts.push({ text: s, isHighlight: false, reason: null })
            }
          })
        }
      })
      parts = newParts
    })

    return parts.map((part, i) => {
      if (part.isHighlight) {
        return (
          <span key={i} className="relative group inline-block">
            <span className={cn("px-1.5 py-0.5 rounded transition-colors cursor-help inline-block mx-0.5 shadow-sm border-b-2 font-medium", currV.bg, currV.color, currV.border)}>
              {part.text}
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-classic-navy text-classic-surface text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 pointer-events-none">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-classic-gold mb-2 text-[9px]"><Search size={12}/> Analysis Finding</div>
              <div className="text-sm font-medium leading-relaxed">{part.reason}</div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-classic-navy"></div>
            </div>
          </span>
        )
      }
      return <span key={i}>{part.text}</span>
    })
  }

  return (
    <div className="w-full bg-classic-background min-h-screen pb-24 relative pt-24">
      <div className="absolute inset-0 bg-grid-architectural opacity-40 pointer-events-none"></div>
      
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 z-50 bg-classic-navy text-classic-surface px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-medium text-sm border border-classic-navy">
            <CheckCircle2 size={18} className="text-classic-safe" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-semibold text-classic-muted hover:text-classic-primary transition-colors">
            <ArrowLeft size={16} /> Back to Scanner
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              disabled={isExporting}
              onClick={() => {
                if (isExporting) return;
                setIsExporting(true);
                showToast('PDF export started');
                setTimeout(() => {
                  try {
                    window.print();
                  } finally {
                    setIsExporting(false);
                  }
                }, 500);
              }} 
              className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <FileText size={16} /> {isExporting ? 'Exporting...' : 'Download PDF'}
            </button>
            <button onClick={copyReport} className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-2">
              <Copy size={16} /> Copy Analysis
            </button>
            <button onClick={() => showToast('Reported as Scam. Thank you for your feedback!')} className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-2 !border-red-200 !text-classic-dangerous hover:!bg-red-50">
              <Flag size={16} /> Report as Scam
            </button>
          </div>
        </div>

        {/* Primary Verdict Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Trust Score Gauge */}
          <div className="classic-card flex flex-col items-center justify-center text-center relative overflow-hidden lg:col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{ backgroundColor: currV.hex }}></div>
            
            <h2 className="text-sm font-bold uppercase tracking-widest text-classic-muted mb-4">Trust Score</h2>
            
            <div className="h-36 w-full relative flex items-center justify-center -mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={70} outerRadius={100} paddingAngle={0} dataKey="value" stroke="none">
                    <Cell fill={currV.hex} />
                    <Cell fill="var(--surface-elevated)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0 text-center flex flex-col items-center">
                <div className="text-5xl font-display font-bold tracking-tighter" style={{ color: currV.hex }}>
                  {trust_score}
                </div>
              </div>
            </div>

            <div className="mt-8 mb-4">
              <div className={cn("inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full font-bold text-sm shadow-sm border", currV.bg, currV.color, currV.border)}>
                <Icon size={16} /> {verdict}
              </div>
            </div>
            
            <div className="bg-classic-surfaceElevated border border-classic-border rounded-lg px-4 py-1.5 text-sm font-semibold text-classic-primary">
              {category}
            </div>
          </div>

          {/* Explanation */}
          <div className="classic-card lg:col-span-2 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={18} className="text-classic-gold" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-classic-muted">Why this result?</h2>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-classic-safe bg-classic-safe/10 px-2 py-0.5 rounded border border-classic-safe/20">Explainable AI</span>
            </div>
            <p className="text-classic-primary font-medium text-lg leading-relaxed mb-4">
              {explanation}
            </p>
            {secondary_categories && secondary_categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs font-bold text-classic-muted uppercase tracking-wider flex items-center">Secondary Signals:</span>
                {secondary_categories.map((sc, i) => (
                  <span key={i} className="text-[10px] font-bold uppercase tracking-widest bg-classic-surfaceElevated text-classic-secondary px-2 py-0.5 rounded border border-classic-border">{sc}</span>
                ))}
              </div>
            )}
            {verification_status && (
              <div className="mt-auto pt-3 border-t border-classic-border/50 text-xs text-classic-muted italic flex items-center gap-1.5">
                <Search size={12} /> {verification_status}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Original Content & Highlights */}
            <div className="classic-card">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-classic-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-classic-muted">Analyzed Content</h2>
                </div>
                {highlights?.length > 0 && (
                  <div className="bg-classic-surfaceElevated text-classic-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100">
                    {highlights.length} Findings
                  </div>
                )}
              </div>
              
              <div className="bg-classic-background border border-classic-border p-6 rounded-xl text-classic-primary text-base whitespace-pre-wrap font-medium leading-relaxed font-sans shadow-inner">
                {renderHighlightedText()}
              </div>
            </div>

            {/* Link Intelligence (If applicable) */}
            {breakdown.links?.analyses?.length > 0 && (
              <div className="classic-card">
                <div className="flex items-center gap-2 mb-6">
                  <Globe size={18} className="text-classic-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-classic-muted">Link Intelligence</h2>
                </div>
                
                {breakdown.links.analyses.map((analysis, i) => (
                  <div key={i} className="mb-6 last:mb-0 border border-classic-border rounded-xl overflow-hidden">
                    <div className="bg-classic-background px-4 py-3 border-b border-classic-border flex items-center justify-between">
                      <div className="font-mono text-sm font-bold text-classic-primary truncate max-w-sm">{analysis.url}</div>
                      {analysis.risk_score > 50 ? <span className="bg-classic-dangerous/10 text-classic-dangerous border border-classic-dangerous/20 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">High Risk</span> : <span className="bg-classic-safe/10 text-classic-safe border border-classic-safe/20 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Low Risk</span>}
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-classic-surface">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-classic-muted mb-1">Protocol</div>
                        <div className={cn("text-sm font-bold flex items-center gap-1", analysis.https ? "text-classic-safe" : "text-classic-dangerous")}>{analysis.https ? <><Lock size={12}/> HTTPS</> : <><AlertTriangle size={12}/> HTTP</>}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase text-classic-muted mb-1">TLD Type</div>
                        <div className={cn("text-sm font-bold", analysis.suspicious_tld ? "text-classic-dangerous" : "text-classic-primary")}>{analysis.suspicious_tld ? "Suspicious" : "Standard"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase text-classic-muted mb-1">Lookalike</div>
                        <div className={cn("text-sm font-bold", analysis.lookalike ? "text-classic-dangerous" : "text-classic-primary")}>{analysis.lookalike ? "Detected" : "None"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase text-classic-muted mb-1">Domain Age</div>
                        <div className="text-sm font-bold text-classic-primary capitalize">{analysis.domain_age}</div>
                      </div>
                    </div>
                    {analysis.findings?.length > 0 && (
                      <div className="p-4 bg-classic-surfaceElevated/50 border-t border-classic-border space-y-2">
                        {analysis.findings.map((f, idx) => (
                          <div key={idx} className="flex gap-2 items-start text-sm font-medium text-classic-primary">
                            <span className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", f.severity === "high" ? "bg-classic-dangerous" : "bg-classic-suspicious")} />
                            {f.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Advice Panel */}
            <div className="classic-card bg-classic-navy text-classic-surface border-classic-navy">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck size={18} className="text-classic-gold" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-classic-gold">What should I do?</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {advice.slice(0,3).map((item, i) => (
                  <div key={i} className="flex flex-col gap-3 border-l-2 border-white/10 pl-4">
                    <div className="text-xs font-display font-bold text-classic-surface opacity-50">{`0${i+1}`}</div>
                    <p className="text-sm font-medium leading-relaxed text-classic-surface opacity-90">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            
            {/* Detection Breakdown */}
            <div className="classic-card">
              <div className="flex items-center gap-2 mb-6">
                <Server size={18} className="text-classic-primary" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-classic-muted">Detection Engines</h2>
              </div>
              
              <div className="space-y-6">
                {[ { name: 'Rule Heuristics', data: breakdown.rules }, { name: 'ML Classifier', data: breakdown.ml }, { name: 'Link Checker', data: breakdown.links } ].map((engine, i) => {
                  const isNA = engine.data.weight === 0
                  return (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-sm text-classic-primary">{engine.name} <span className="text-classic-muted font-normal text-xs ml-1">(Trust Score)</span></span>
                      {isNA ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-classic-surfaceElevated text-classic-muted px-2 py-0.5 rounded border border-classic-border">N/A</span>
                      ) : (
                        <span className="text-xs font-bold text-classic-primary">{engine.data.score}/100</span>
                      )}
                    </div>
                    <div className="h-1.5 w-full bg-classic-background rounded-full overflow-hidden mb-2">
                      <div className={cn("h-full rounded-full transition-all duration-1000", engine.data.score < 40 ? "bg-classic-dangerous" : engine.data.score < 70 ? "bg-classic-suspicious" : "bg-classic-safe", isNA && "bg-transparent")} style={{ width: isNA ? 0 : `${engine.data.score}%` }} />
                    </div>
                    {engine.data.reason && <p className="text-xs text-classic-muted font-medium">{engine.data.reason}</p>}
                  </div>
                )})}
              </div>
            </div>

            {/* Evidence Trail */}
            <div className="classic-card">
              <div className="flex items-center gap-2 mb-6">
                <Activity size={18} className="text-classic-primary" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-classic-muted">Evidence Trail</h2>
              </div>
              
              <div className="space-y-0 relative before:absolute before:inset-0 before:ml-2 before:w-px before:bg-classic-border">
                {[
                  { label: 'Input normalized', status: 'done' },
                  { label: isUrlOnly ? 'Text analysis skipped' : 'Risk phrases mapped', status: isUrlOnly ? 'skip' : 'done' },
                  { label: breakdown.links.weight > 0 ? 'Domain verified' : 'No URLs detected', status: breakdown.links.weight > 0 ? 'done' : 'skip' },
                  { label: 'Signals fused', status: 'done' },
                  { label: 'AI Explanation generated', status: 'done' }
                ].map((step, i) => (
                  <div key={i} className="relative flex items-start gap-4 pb-6 last:pb-0">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 z-10 bg-classic-surface", step.status === 'skip' ? "border-classic-border" : "border-classic-safe")}>
                      {step.status === 'done' && <div className="w-1.5 h-1.5 bg-classic-safe rounded-full"></div>}
                    </div>
                    <div className={cn("text-xs font-semibold", step.status === 'skip' ? "text-classic-muted" : "text-classic-primary")}>{step.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
