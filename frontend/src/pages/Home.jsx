import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api';
import { Mic, Image as ImageIcon, Search, ShieldCheck, Lock, Globe, FileText, CheckCircle, Smartphone, CreditCard, Building, Crosshair, Loader2, Link as LinkIcon, MessageSquare, Brain, ScanLine, AlertTriangle, PlayCircle, BookOpen, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Tesseract from 'tesseract.js'
import { cn } from '../lib/utils'

export default function Home() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingState, setLoadingState] = useState('')
  const [error, setError] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStatus, setRecordingStatus] = useState('') // '', 'Listening', 'Processing', 'Error'
  const [recordingError, setRecordingError] = useState('')
  const [interimText, setInterimText] = useState('')
  const [customVocab, setCustomVocab] = useState({ 'jashwanth': 'Jeshwanth', 'jashwant': 'Jeshwanth' })
  const recognitionRef = useRef(null)
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])
  const [inputType, setInputType] = useState('message')
  
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const [maskSensitive, setMaskSensitive] = useState(true)
  const [backendStatus, setBackendStatus] = useState('checking') // checking, online, offline

  const analysisSteps = [
    "Preprocessing and Normalizing",
    "Evaluating Heuristic Rules",
    "Running Machine Learning Classifier",
    "Inspecting Domain Reputation",
    "Fusing Intelligence Signals",
    "Generating Explanation"
  ]

  const { user } = useAuth();
  
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.get('/api/health')
        setBackendStatus('online')
      } catch (err) {
        setBackendStatus('offline')
      }
    }
    checkHealth()
  }, [])
  

  const handleAnalyze = async (e) => {
    if (!user) {
      e?.preventDefault();
      navigate('/login');
      return;
    }
    e?.preventDefault()
    if (!text.trim()) return

    setLoading(true)
    setError(null)
    
    // Simulate loading UX
    for (let i = 0; i < analysisSteps.length; i++) {
      setLoadingState(analysisSteps[i])
      await new Promise(r => setTimeout(r, 200 + Math.random() * 200))
    }

    try {
      const payload = {
        text,
        input_type: inputType,
        save_history: true,
        mask_sensitive: maskSensitive
      }

      const response = await api.post('/api/analyze', payload)
      const data = response.data
      
      // Basic response validation
      if (!data || data.trust_score === undefined || !data.verdict) {
        throw new Error('Invalid response received from the analysis engine.')
      }

      navigate('/result', { state: { result: data } })
    } catch (err) {
      console.error("Network or execution error:", err)
      let errorMsg = err.response?.data?.detail || err.message;
      if (err.message === 'Network Error') errorMsg = 'Backend unavailable. Please verify connection.';
      setError(errorMsg)
      setLoading(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setLoading(true)
    setLoadingState("Extracting text from image...")
    try {
      const result = await Tesseract.recognize(file, 'eng')
      setText(result.data.text)
    } catch (err) {
      setError("Failed to process image text.")
    } finally {
      setLoading(false)
      setLoadingState("")
    }
  }

  const applyCorrections = (transcript) => {
    let corrected = transcript;
    Object.keys(customVocab).forEach(key => {
      const regex = new RegExp("\b" + key + "\b", "gi");
      corrected = corrected.replace(regex, customVocab[key]);
    });
    return corrected;
  }

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
      setRecordingStatus('Ready')
      setInterimText('')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecordingError("Voice recognition is not supported in this browser.")
      setRecordingStatus('Error')
      setTimeout(() => { setRecordingError(''); setRecordingStatus('') }, 4000)
      return
    }

    setRecordingError('')
    setRecordingStatus('Ready')
    setInterimText('')

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-IN'

      recognition.onstart = () => {
        setIsRecording(true)
        setRecordingStatus('Listening')
      }

      recognition.onresult = (event) => {
        setRecordingStatus('Processing')
        let interim = ''
        let finalStr = ''
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript
          } else {
            interim += event.results[i][0].transcript
          }
        }

        if (finalStr) {
          const corrected = applyCorrections(finalStr)
          setText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + corrected.trim() + ' ')
        }
        
        setInterimText(interim)
        
        if (interim) {
          setRecordingStatus('Listening')
        }
      }

      recognition.onerror = (event) => {
        setIsRecording(false)
        setInterimText('')
        setRecordingStatus('Error')
        if (event.error === 'not-allowed') {
          setRecordingError("Microphone permission denied. Please allow microphone access.")
        } else if (event.error === 'no-speech') {
          setRecordingError("No speech was detected.")
        } else if (event.error === 'network') {
          setRecordingError("Network error occurred.")
        } else {
          setRecordingError(`Recognition error: ${event.error}`)
        }
        setTimeout(() => { setRecordingError(''); setRecordingStatus('') }, 4000)
      }

      recognition.onend = () => {
        setIsRecording(false)
        setInterimText('')
        if (recordingStatus !== 'Error') {
          setRecordingStatus('')
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      setIsRecording(false)
      setInterimText('')
      setRecordingStatus('Error')
      setRecordingError("Failed to start voice recognition.")
      setTimeout(() => { setRecordingError(''); setRecordingStatus('') }, 4000)
    }
  }

  const scrollToAnalyzer = () => {
    const analyzer = document.getElementById('analyzer')
    if (analyzer) {
      analyzer.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => {
        const input = document.getElementById('content-input')
        if (input) input.focus({ preventScroll: true })
      }, 500) // Delay to let scroll finish
    }
  }

  return (
    <div className="w-full flex flex-col bg-classic-background relative overflow-hidden">
      
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 bg-grid-architectural opacity-60 pointer-events-none"></div>

      {/* 1. ELEGANT HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-4 pb-12 lg:pt-4 lg:pb-20 flex flex-col lg:flex-row items-center gap-10 lg:gap-8">
        
        {/* Left Side: Typography & CTA */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-classic-gold/30 bg-classic-gold/5 mb-8">
            <span className="w-2 h-2 rounded-full bg-classic-gold animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-classic-gold">Intelligence Platform</span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl lg:text-7xl font-display font-bold text-classic-primary mb-6 leading-[1.1] tracking-tight">
            See through <br/><span className="text-classic-primary italic font-light">the noise.</span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-classic-primary font-display font-medium mb-4">
            Detect scams. Verify stories. Stay safe.
          </motion.p>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-classic-secondary max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed mb-10">
            Analyze suspicious messages, news articles, and links using a hybrid AI system that explains the warning signs behind every result.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button onClick={scrollToAnalyzer} className="btn-primary w-full sm:w-auto">
              Analyze Content
            </button>
            <button onClick={() => navigate('/learn')} className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto">
              <BookOpen size={18} /> Explore Scam Playbook
            </button>
          </motion.div>
          
          {/* Micro Features */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-12 flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-classic-primary"><ShieldCheck size={16} className="text-classic-safe"/> Explainable AI</div>
            <div className="flex items-center gap-2 text-sm font-semibold text-classic-primary"><ScanLine size={16} className="text-classic-gold"/> Hybrid Detection</div>
            <div className="flex items-center gap-2 text-sm font-semibold text-classic-primary"><Lock size={16} className="text-classic-primary"/> Privacy-Aware</div>
            <div className="flex items-center gap-2 text-sm font-semibold text-classic-primary"><Globe size={16} className="text-classic-secondary"/> Multilingual</div>
          </motion.div>
        </div>

        {/* Right Side: Custom Illustration */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="flex-1 relative w-full max-w-xl aspect-square flex items-center justify-center">
          <div className="absolute inset-0 bg-classic-surface rounded-full shadow-2xl opacity-40 blur-3xl"></div>
          
          {/* Main SVG Composition */}
          <div className="relative w-full h-full flex items-center justify-center z-10 animate-float">
            {/* Center Shield & Magnifying Glass */}
            <div className="relative z-20 w-40 h-40 bg-classic-surface rounded-full shadow-classic flex items-center justify-center border-4 border-classic-ivory">
              <div className="absolute inset-2 border border-classic-gold/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
              <ShieldCheck size={64} className="text-classic-primary absolute z-10" />
              <Search size={80} className="text-classic-gold absolute -bottom-6 -right-6 drop-shadow-lg opacity-80" strokeWidth={1.5} />
            </div>

            {/* Orbiting Elements */}
            <div className="absolute inset-10 border border-classic-border rounded-full animate-[spin_20s_linear_infinite]">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-classic-surface rounded-2xl shadow-md border border-classic-border flex items-center justify-center text-classic-safe">
                 <MessageSquare size={20} />
               </div>
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 bg-classic-surface rounded-2xl shadow-md border border-classic-border flex items-center justify-center text-classic-primary">
                 <Globe size={20} />
               </div>
            </div>

            <div className="absolute inset-0 border border-classic-border rounded-full border-dashed animate-[spin_30s_linear_infinite_reverse]">
               <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-classic-navy text-classic-surface rounded-full shadow-md flex items-center justify-center">
                 <Brain size={16} />
               </div>
               <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-classic-gold text-classic-surface rounded-full shadow-md flex items-center justify-center">
                 <FileText size={16} />
               </div>
            </div>
            
            {/* Floating connecting lines */}
            <svg className="absolute inset-0 w-full h-full -z-10 opacity-30" viewBox="0 0 400 400">
               <path d="M 200 200 L 100 100" stroke="#14213D" strokeWidth="1" strokeDasharray="4 4" />
               <path d="M 200 200 L 300 300" stroke="#14213D" strokeWidth="1" strokeDasharray="4 4" />
               <path d="M 200 200 L 350 150" stroke="#C9A24B" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* 2. ANALYZER SECTION */}
      <section id="analyzer" className="scroll-mt-28 max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-20 pb-24">
        <div className="classic-card relative overflow-hidden bg-classic-surface/95 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-classic-gold/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-classic-surfaceElevated text-classic-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-classic-border shadow-sm">
              <ScanLine size={24} />
            </div>
            <h2 className="text-2xl font-display font-bold">Analyze suspicious content</h2>
            <p className="text-classic-secondary text-sm mt-2">Paste a message, examine a news article, or inspect a link.</p>
          </div>
          
          <div className="flex border-b border-classic-border mb-6">
            {[
              { id: 'message', icon: MessageSquare, label: 'Message' },
              { id: 'news', icon: FileText, label: 'News Article' },
              { id: 'link', icon: LinkIcon, label: 'Link' }
            ].map(t => (
              <button key={t.id} onClick={() => setInputType(t.id)} className={cn("flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all", inputType === t.id ? "border-classic-gold text-classic-primary bg-classic-surfaceElevated" : "border-transparent text-classic-secondary hover:text-classic-primary hover:bg-classic-surfaceElevated/50")}>
                <t.icon size={16} /> <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleAnalyze} className="relative z-10">
            <div className="relative">
              <textarea id="content-input"
                className="input-classic h-48 resize-none text-lg leading-relaxed shadow-inner"
                placeholder={inputType === 'link' ? "https://example-suspicious-link.com" : "Paste content here to inspect..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loading}
                maxLength={5000}
              />
              <div className="absolute bottom-4 right-4 text-xs font-semibold text-classic-secondary">
                {text.length} / 5000
              </div>
            </div>

            {/* Elegant Loading State */}
            <AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-classic-surface/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-20">
                  <div className="w-16 h-16 relative mb-6">
                    <div className="absolute inset-0 border-2 border-classic-border rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-transparent border-t-classic-navy rounded-full animate-[spin_1s_ease-in-out_infinite]"></div>
                    <Brain size={24} className="absolute inset-0 m-auto text-classic-primary animate-pulse" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-classic-primary mb-2">Analyzing your content</h3>
                  <div className="flex items-center gap-3 bg-classic-surfaceElevated px-4 py-2 rounded-lg border border-classic-border">
                    <Loader2 size={14} className="animate-spin text-classic-primary"/>
                    <span className="text-sm font-semibold text-classic-primary">{loadingState}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="mt-4 p-4 bg-classic-dangerous/5 border border-classic-dangerous/20 rounded-xl text-classic-dangerous flex items-center gap-3 text-sm font-medium">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl border border-classic-border text-classic-secondary hover:text-classic-primary hover:bg-classic-surfaceElevated transition-colors shadow-sm bg-classic-surface" title="Upload Screenshot">
                  <ImageIcon size={18} />
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                
                <button type="button" onClick={toggleRecording} className={cn("p-2.5 rounded-xl border transition-colors shadow-sm bg-classic-surface", isRecording ? "bg-red-50 border-red-200 text-classic-dangerous animate-pulse" : "border-classic-border text-classic-secondary hover:text-classic-primary hover:bg-classic-surfaceElevated")} title="Voice Input">
                  <Mic size={18} />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-classic-secondary cursor-pointer hover:text-classic-primary">
                  <input type="checkbox" className="rounded text-classic-primary focus:ring-classic-navy" checked={maskSensitive} onChange={(e) => setMaskSensitive(e.target.checked)} />
                  Mask sensitive info
                </label>
                <button type="submit" disabled={!text.trim() || loading} className="btn-primary">
                  Analyze with AI
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="bg-classic-surface py-24 border-y border-classic-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-classic-primary mb-4">How it works</h2>
            <p className="text-classic-primary font-medium">Four simple steps to verify digital truth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-12 left-24 right-24 h-px bg-classic-border"></div>
            
            {[
              { num: '01', title: 'Submit', desc: 'Paste a message, article, or suspicious URL.', icon: Send },
              { num: '02', title: 'Analyze', desc: 'Combine rules, machine learning, and link signals.', icon: Brain },
              { num: '03', title: 'Understand', desc: 'See the suspicious phrases and why they were flagged.', icon: FileText },
              { num: '04', title: 'Act', desc: 'Receive practical guidance for safer decisions.', icon: ShieldCheck }
            ].map((step, i) => (
              <div key={i} className="relative bg-classic-background rounded-2xl p-6 border border-classic-border shadow-sm text-center group hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-classic-surface rounded-full border-2 border-classic-navy text-classic-primary flex items-center justify-center font-bold font-display mx-auto mb-6 relative z-10 shadow-sm group-hover:bg-classic-navy group-hover:text-classic-surface transition-colors">
                  {step.num}
                </div>
                <div className="text-classic-gold mb-4 flex justify-center"><step.icon size={24}/></div>
                <h3 className="font-bold text-lg mb-2 text-classic-primary">{step.title}</h3>
                <p className="text-sm text-classic-secondary font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. DETECTION CAPABILITIES */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold text-classic-primary mb-4">What can the detector recognize?</h2>
          <p className="text-classic-primary font-medium max-w-2xl mx-auto leading-relaxed">
            The tool identifies risk indicators across various domains. It encourages independent verification rather than acting as a definitive arbiter of truth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "KYC & Banking Scams", icon: Building },
            { title: "OTP Phishing", icon: Smartphone },
            { title: "Lottery & Prizes", icon: CreditCard },
            { title: "Fake Job Offers", icon: FileText },
            { title: "Suspicious Links", icon: Globe },
            { title: "Health Hoaxes", icon: ShieldCheck },
            { title: "Clickbait", icon: Crosshair },
            { title: "Misinformation", icon: AlertTriangle }
          ].map((item, i) => (
            <div key={i} className="bg-classic-surface rounded-2xl p-6 border border-classic-border shadow-sm flex items-center gap-4 group hover:-translate-y-1 hover:border-classic-gold/50 transition-all cursor-default">
              <div className="w-12 h-12 bg-classic-surfaceElevated text-classic-primary rounded-xl flex items-center justify-center shrink-0 border border-classic-border group-hover:bg-classic-navy group-hover:text-classic-surface transition-colors">
                <item.icon size={20} />
              </div>
              <h4 className="font-bold text-classic-primary text-sm">{item.title}</h4>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  )
}
