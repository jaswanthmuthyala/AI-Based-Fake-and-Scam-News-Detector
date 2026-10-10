import { useState, useEffect } from 'react'
import api from '../lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'
import { Search, Loader2, ShieldAlert, AlertTriangle, Activity, TrendingUp, Calendar, ScanSearch, Gauge, TriangleAlert, Brain, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.get('/api/stats').then(res => res.data),
          api.get('/api/history').then(res => res.data)
        ])
        const s = statsRes
        const h = historyRes
        setStats(s)
        setHistory(h)
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[80vh]">
        <Loader2 size={32} className="animate-spin text-classic-navy mb-4" />
        <span className="font-sans font-bold text-sm text-classic-muted tracking-widest uppercase">Loading Analytics...</span>
      </div>
    )
  }

  // Derive metrics
  const totalScans = stats?.total_scans || 0
  const dangerousCount = stats?.verdict_counts?.Dangerous || 0
  const suspiciousCount = stats?.verdict_counts?.Suspicious || 0
  const safeCount = stats?.verdict_counts?.Safe || 0
  const scamsDetected = suspiciousCount + dangerousCount
  const avgTrustScore = stats?.average_trust_score || 0

  const donutData = [
    { name: 'Safe', value: safeCount, color: '#2F7D5B' },
    { name: 'Suspicious', value: suspiciousCount, color: '#C98A1B' },
    { name: 'Dangerous', value: dangerousCount, color: '#A63A3A' },
  ].filter(d => d.value > 0)

  const barData = Object.entries(stats?.category_counts || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Risk trend using history
  const trendData = [...history].reverse().slice(0, 15).map((h, i) => {
    const d = new Date(h.created_at)
    return {
      name: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
      score: h.trust_score,
      verdict: h.verdict
    }
  })

  const validScores = trendData.map(d => d.score)
  const highestScore = validScores.length ? Math.max(...validScores) : null
  const lowestScore = validScores.length ? Math.min(...validScores) : null
  const latestScan = trendData.length ? trendData[trendData.length - 1] : null

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const color = data.score >= 70 ? '#2F7D5B' : data.score >= 40 ? '#C98A1B' : '#A63A3A';
      let interpretation = 'High trust score';
      if (data.score < 40) interpretation = 'Low trust score';
      else if (data.score < 70) interpretation = 'Moderate trust score';
      
      return (
        <div className="bg-classic-surface p-4 rounded-xl border border-classic-border shadow-md min-w-[180px]">
          <div className="text-[9px] font-bold uppercase tracking-widest text-classic-muted mb-2 border-b border-classic-border pb-2">Scan Details</div>
          <div className="text-xs text-classic-navy font-bold mb-3">{data.name}</div>
          
          <div className="mb-2">
            <div className="text-[10px] uppercase text-classic-muted font-semibold mb-0.5">Trust Score</div>
            <div className="text-lg font-display font-bold text-classic-navy">{data.score} <span className="text-[10px] font-sans text-classic-muted">/ 100</span></div>
          </div>
          
          <div className="mb-2">
            <div className="text-[10px] uppercase text-classic-muted font-semibold mb-0.5">Verdict</div>
            <div className="text-xs font-bold" style={{ color }}>{data.verdict}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase text-classic-muted font-semibold mb-0.5">Interpretation</div>
            <div className="text-xs font-medium text-classic-charcoal">{interpretation}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  const filteredHistory = filter === 'All' ? history : history.filter(h => h.verdict === filter)

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
      <div className="w-24 h-24 mb-8 bg-classic-surfaceElevated rounded-full flex items-center justify-center text-classic-navy">
        <Activity size={32} />
      </div>
      <h2 className="text-3xl font-display font-bold text-classic-navy mb-4">No scans yet</h2>
      <p className="text-classic-charcoal max-w-sm mx-auto mb-10 font-medium">Analyze your first message to start building your Trust Intelligence Dashboard.</p>
      <a href="/" className="btn-primary inline-flex items-center gap-2"><Search size={18}/> Analyze Content</a>
    </div>
  )

  const CardHeader = ({ title, subtitle }) => (
    <div className="mb-6">
      <h3 className="text-[15px] font-bold text-classic-navy">{title}</h3>
      {subtitle && <p className="text-xs text-classic-muted font-medium mt-1">{subtitle}</p>}
    </div>
  )

  const getVerdictColor = (score) => {
    if (score >= 70) return '#2F7D5B'
    if (score >= 40) return '#C98A1B'
    return '#A63A3A'
  }

  const gaugeColor = getVerdictColor(avgTrustScore)
  const gaugeData = [
    { name: 'Score', value: avgTrustScore },
    { name: 'Remaining', value: 100 - avgTrustScore },
  ]

  // AI Summary logic
  let aiSummaryText = "More scans are needed to generate meaningful insights."
  if (totalScans > 0) {
    if (scamsDetected > totalScans / 2) {
      aiSummaryText = `High threat activity detected. ${scamsDetected} of your ${totalScans} recent scans flagged as risky. The most common threat vector is ${stats?.most_common_category}. Remain vigilant.`
    } else {
      aiSummaryText = `System stable. Most of your analyzed content appears safe. Average trust score is strong at ${avgTrustScore}/100. Keep scanning unknown links.`
    }
  }

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-classic-navy tracking-tight">Trust Intelligence Dashboard</h1>
        <p className="text-classic-muted font-medium mt-1">An overview of your analysis activity, detected risks, and content trust signals.</p>
      </div>
      
      {totalScans === 0 ? <EmptyState /> : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-classic-surface rounded-2xl p-6 border border-classic-border shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-classic-safe/10 flex items-center justify-center text-classic-safe shrink-0">
                  <ScanSearch size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-classic-muted text-right">Lifetime</span>
              </div>
              <h4 className="text-3xl font-display font-bold text-classic-navy mb-1">{totalScans}</h4>
              <p className="text-xs font-semibold text-classic-muted">Total Scans</p>
            </div>

            <div className="bg-classic-surface rounded-2xl p-6 border border-classic-border shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-classic-mutedBlue/10 flex items-center justify-center text-classic-mutedBlue shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-classic-muted text-right">Sus + Dang</span>
              </div>
              <h4 className="text-3xl font-display font-bold text-classic-navy mb-1">{scamsDetected}</h4>
              <p className="text-xs font-semibold text-classic-muted">Scams Detected</p>
            </div>

            <div className="bg-classic-surface rounded-2xl p-6 border border-classic-border shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-classic-gold/10 flex items-center justify-center text-classic-gold shrink-0">
                  <Gauge size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-classic-muted text-right">Mean</span>
              </div>
              <h4 className="text-3xl font-display font-bold text-classic-navy mb-1">{avgTrustScore}</h4>
              <p className="text-xs font-semibold text-classic-muted">Average Trust Score</p>
            </div>

            <div className="bg-classic-surface rounded-2xl p-6 border border-classic-border shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-classic-dangerous/10 flex items-center justify-center text-classic-dangerous shrink-0">
                  <TriangleAlert size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-classic-muted text-right">High Risk</span>
              </div>
              <h4 className="text-3xl font-display font-bold text-classic-navy mb-1">{dangerousCount}</h4>
              <p className="text-xs font-semibold text-classic-muted">Dangerous Alerts</p>
            </div>
          </div>

          {/* Panel Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Trust Score Overview */}
            <div className="bg-classic-surface rounded-2xl p-6 border border-classic-border shadow-sm flex flex-col text-center">
              <CardHeader title="Trust Score Overview" subtitle="Overall trustworthiness of analyzed content." />
              <div className="h-40 w-full relative flex items-center justify-center -mb-6 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gaugeData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={80} outerRadius={110} paddingAngle={0} dataKey="value" stroke="none">
                      <Cell fill={gaugeColor} />
                      <Cell fill="#F3F4F6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                  <div className="text-5xl font-display font-bold tracking-tighter" style={{ color: gaugeColor }}>
                    {avgTrustScore}<span className="text-2xl text-classic-muted/50 font-sans ml-1">/100</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 font-semibold text-sm" style={{ color: gaugeColor }}>
                {avgTrustScore >= 70 ? 'Generally Safe' : avgTrustScore >= 40 ? 'Requires Caution' : 'High Risk Level'}
              </div>
              <div className="flex justify-between mt-6 text-[10px] font-bold uppercase text-classic-muted px-4 border-t border-classic-border pt-4">
                <span>0</span>
                <span>100</span>
              </div>
            </div>

            {/* Verdict Distribution */}
            <div className="bg-classic-surface rounded-2xl p-6 border border-classic-border shadow-sm flex flex-col">
              <CardHeader title="Verdict Distribution" subtitle="Proportion of results across all scans." />
              <div className="flex-1 relative min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                      {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip cursor={false} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-display font-bold text-classic-navy">{totalScans}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-classic-muted">Total</span>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {donutData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs font-semibold">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-classic-charcoal">{d.name} <span className="text-classic-muted">({d.value})</span></span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Trust Analysis */}
            <div className="bg-classic-surface rounded-2xl p-6 border border-classic-border shadow-sm flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-classic-surfaceElevated rounded-bl-full -z-0 opacity-50"></div>
              <CardHeader title="AI Trust Analysis" subtitle="Insights from your actual scan history." />
              <div className="flex-1 flex flex-col relative z-10">
                <div className="w-12 h-12 rounded-full bg-classic-navy flex items-center justify-center text-classic-surface mb-6">
                  <Brain size={20} />
                </div>
                <p className="text-sm text-classic-charcoal font-medium leading-relaxed mb-6 flex-1">
                  {aiSummaryText}
                </p>
                <button onClick={() => navigate('/')} className="flex items-center justify-between bg-classic-pageBg border border-classic-border rounded-lg px-4 py-3 text-sm font-semibold hover:bg-classic-surface hover:border-classic-navy transition-colors">
                  <span className="text-classic-navy">Analyze New Content</span>
                  <ArrowRight size={16} className="text-classic-muted" />
                </button>
              </div>
            </div>

          </div>

          {/* Panel Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Trust Score History */}
            <div className="bg-classic-surface rounded-2xl p-6 border border-classic-border shadow-sm lg:col-span-2 flex flex-col min-h-[400px]">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                <div>
                  <h3 className="text-[15px] font-bold text-classic-navy">Trust Score History</h3>
                  <p className="text-xs text-classic-muted font-medium mt-1">See how the trustworthiness of your analyzed content changes over time.</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-classic-muted">Higher score = higher trust</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-classic-muted mt-1">100 = highest trust · 0 = lowest trust</p>
                </div>
              </div>

              {/* Small Legend */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-classic-muted mb-4 border-b border-classic-border pb-4">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-classic-mutedBlue"></div> Trust Score</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-classic-safe"></div> Safe</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-classic-suspicious"></div> Suspicious</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-classic-dangerous"></div> Dangerous</div>
              </div>

              {/* Summary Row */}
              <div className="flex flex-wrap gap-6 mb-4">
                <div className="text-xs text-classic-charcoal font-medium">
                  <span className="text-classic-muted mr-1">Latest:</span> 
                  <span className="font-bold">{latestScan ? `${latestScan.score} / 100` : '—'}</span>
                </div>
                <div className="text-xs text-classic-charcoal font-medium">
                  <span className="text-classic-muted mr-1">Highest:</span> 
                  <span className="font-bold">{highestScore !== null ? `${highestScore} / 100` : '—'}</span>
                </div>
                <div className="text-xs text-classic-charcoal font-medium">
                  <span className="text-classic-muted mr-1">Lowest:</span> 
                  <span className="font-bold">{lowestScore !== null ? `${lowestScore} / 100` : '—'}</span>
                </div>
              </div>

              {/* Latest scan focus */}
              {latestScan && (
                <div className="mb-4 text-xs font-semibold text-classic-charcoal">
                  Latest scan: <span className="font-bold">{latestScan.score} / 100</span> · <span style={{ color: getVerdictColor(latestScan.score) }}>{latestScan.verdict}</span>
                </div>
              )}

              {trendData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center mt-4 border-2 border-dashed border-classic-border rounded-xl">
                  <p className="text-sm font-bold text-classic-navy mb-2">No scan history yet</p>
                  <p className="text-xs font-medium text-classic-muted mb-4 max-w-sm">Analyze a message, news article, or link to start tracking trust scores.</p>
                  <button onClick={() => navigate('/')} className="btn-secondary !py-2 !px-4 text-xs">Analyze Content</button>
                </div>
              ) : (
                <div className="flex-1 w-full min-h-[200px] mt-2 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--muted-blue)" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="var(--muted-blue)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} 
                        axisLine={false} 
                        tickLine={false} 
                        minTickGap={40}
                        tickFormatter={(value) => value.split(',')[0]} 
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        ticks={[0, 25, 50, 75, 100]}
                        tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} 
                        axisLine={false} 
                        tickLine={false} 
                        label={{ value: 'Trust Score (0–100)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 } }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="linear" dataKey="score" stroke="var(--muted-blue)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: "var(--surface)", strokeWidth: 2, stroke: "var(--muted-blue)" }} dot={{ r: 3, fill: "var(--surface)", strokeWidth: 2, stroke: "var(--muted-blue)" }} animationDuration={1000} />
                    </AreaChart>
                  </ResponsiveContainer>
                  
                  {trendData.length === 1 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-classic-surface/95 px-4 py-2 rounded-lg border border-classic-border shadow-sm text-xs font-semibold text-classic-charcoal">
                        Run more scans to see how trust scores change over time.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation Footer */}
              <div className="mt-6 pt-4 border-t border-classic-border text-[10px] text-classic-muted font-medium leading-relaxed">
                Each point represents one completed scan. The score measures the detector's estimated trustworthiness of the submitted content; it does not independently verify whether a claim is true.
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-classic-surface rounded-2xl p-6 border border-classic-border shadow-sm flex flex-col min-h-[300px]">
              <CardHeader title="Top Detected Categories" subtitle="Distribution of specific threat vectors." />
              {barData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm font-medium text-classic-muted">No categories detected.</div>
              ) : (
                <div className="flex-1 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: 'var(--text-primary)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'var(--surface-elevated)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                      <Bar dataKey="count" fill="var(--muted-blue)" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          {/* Recent Scan Activity Table */}
          <div className="bg-classic-surface rounded-2xl border border-classic-border shadow-sm overflow-hidden mb-8">
            <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-classic-border bg-classic-surface">
              <CardHeader title="Recent Scan Activity" subtitle="Historical record of your analyzed content." />
              <div className="flex bg-classic-pageBg p-1 rounded-lg border border-classic-border shadow-sm">
                {['All', 'Safe', 'Suspicious', 'Dangerous'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", filter === f ? "bg-classic-surface text-classic-navy shadow-sm" : "text-classic-muted hover:text-classic-navy")}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-classic-border text-[10px] uppercase font-bold tracking-widest text-classic-secondary bg-classic-surfaceElevated">
                    <th className="py-4 px-6 font-semibold">Date</th>
                    <th className="py-4 px-6 font-semibold">Analyzed Content</th>
                    <th className="py-4 px-6 font-semibold">Category</th>
                    <th className="py-4 px-6 font-semibold">Score</th>
                    <th className="py-4 px-6 font-semibold">Verdict</th>
                    <th className="py-4 px-6 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredHistory.map((item) => (
                      <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={item.id} className="border-b border-classic-border hover:bg-classic-surfaceElevated transition-colors group cursor-default">
                        <td className="py-4 px-6 text-xs font-medium text-classic-muted whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium max-w-[200px] truncate text-classic-charcoal" title={item.original_text}>
                          {item.original_text}
                        </td>
                        <td className="py-4 px-6 text-xs font-semibold text-classic-muted">
                          {item.category}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-display font-bold text-base text-classic-navy">{item.trust_score}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest", 
                            item.verdict === 'Dangerous' ? "bg-classic-dangerous/10 text-classic-dangerous border border-classic-dangerous/20" :
                            item.verdict === 'Suspicious' ? "bg-classic-suspicious/10 text-classic-suspicious border border-classic-suspicious/20" :
                            "bg-classic-safe/10 text-classic-safe border border-classic-safe/20"
                          )}>
                            {item.verdict}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button onClick={() => navigate('/result', { state: { result: item } })} className="text-classic-mutedBlue hover:text-classic-navy text-xs font-bold transition-colors">View Details</button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filteredHistory.length === 0 && (
                <div className="text-center py-16 text-sm font-medium text-classic-muted">No records match the selected filter.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
