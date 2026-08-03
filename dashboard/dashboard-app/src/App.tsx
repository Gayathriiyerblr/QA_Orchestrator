import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Activity, CheckCircle, XCircle, RefreshCw, BarChart3, Terminal, Bug, FileSpreadsheet, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './App.css';

const socket = io('http://localhost:5000');

interface TestCase {
  tcid: string;
  status: string;
  duration?: string;
  error?: string;
  summary?: string | null;
}

interface Bug {
  bugId: string;
  tcid: string;
  title: string;
  severity?: string;
  status?: string;
  jiraUrl?: string;
}

interface TestInsight {
  rootCause?: string;
  suggestion?: string;
}

interface TicketInsights {
  insights?: Record<string, TestInsight>;
  rootCause?: string;
  suggestion?: string;
  generatedBy?: string;
  summary?: string;
}

interface TicketData {
  jiraId: string;
  title: string;
  total: number;
  passed: number;
  failed: number;
  healed: number;
  timestamp: string | null;
  status: string | null;
  results: TestCase[];
  bugs: Bug[];
  insights: TicketInsights | null;
  requirementSource?: string | null;
}

interface TestData {
  totalTests: number;
  passed: number;
  failed: number;
  healed: number;
  agentStatus: string;
  recentLogs: string[];
}

const App: React.FC = () => {
  const [data, setData] = useState<TestData>({
    totalTests: 0,
    passed: 0,
    failed: 0,
    healed: 0,
    agentStatus: 'Standby',
    recentLogs: []
  });
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadResults = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/results');
      const dataJson = await res.json();
      const list = dataJson.tickets || [];
      setTickets(list);
      if (list.length > 0) {
        // Prefer SCRUM-10, else the most recent ticket
        const preferred = list.find((t: TicketData) => t.jiraId === 'SCRUM-10') || list[0];
        setSelected(prev => prev || preferred.jiraId);
        const agg = list.reduce((acc: { totalTests: number; passed: number; failed: number; healed: number }, t: TicketData) => ({
          totalTests: acc.totalTests + (t.total || 0),
          passed: acc.passed + (t.passed || 0),
          failed: acc.failed + (t.failed || 0),
          healed: acc.healed + (t.healed || 0),
        }), { totalTests: 0, passed: 0, failed: 0, healed: 0 });
        setData(prev => ({ ...prev, ...agg }));
      }
    } catch (e) {
      console.error('Failed to load results', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
    socket.on('status_changed', (message: any) => {
      if (message.type === 'DATA_UPDATE') {
        setData(prev => ({
          ...prev,
          ...message.data,
          recentLogs: [...(message.data.recentLogs || []), ...prev.recentLogs].slice(0, 12)
        }));
        // Refresh persisted results when a run broadcasts an update
        loadResults();
      } else if (message.type === 'STATUS_UPDATE') {
        setData(prev => ({ ...prev, agentStatus: message.status }));
      }
    });

    return () => {
      socket.off('status_changed');
    };
  }, []);

  const activeTicket = tickets.find(t => t.jiraId === selected) || tickets[0];

  return (
    <div className="dashboard-container">
      <div className="bg-glow">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
      </div>

      <header>
        <div>
          <h1>OrchestrAI</h1>
          <div className="subtitle">
            <div className="pulse"></div>
            Orchestration Dashboard • v1.1.0
          </div>
        </div>

        <div className="agent-badge">
          <div className={`status-dot ${data.agentStatus === 'Error occurred' ? 'status-error' : ''}`}></div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            AI Agent: <span style={{ color: 'white', fontStyle: 'italic' }}>{data.agentStatus}</span>
          </span>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading results…</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard icon={<BarChart3 size={20} color="#818cf8" />} label="Total Executed" value={data.totalTests} />
            <StatCard icon={<CheckCircle size={20} color="#34d399" />} label="Total Passed" value={data.passed} />
            <StatCard icon={<XCircle size={20} color="#fb7185" />} label="Total Failed" value={data.failed} />
            <StatCard icon={<RefreshCw size={20} color="#38bdf8" />} label="Self Healed" value={data.healed} />
          </div>

          {/* Ticket selector */}
          <div className="ticket-strip">
            {tickets.map(t => (
              <button
                key={t.jiraId}
                className={`ticket-chip ${selected === t.jiraId ? 'ticket-chip-active' : ''} ${t.status === 'FAIL' ? 'ticket-chip-fail' : ''}`}
                onClick={() => setSelected(t.jiraId)}
              >
                <span className="chip-top">
                  <span className="chip-requirement">Requirement ID</span>
                  <span className={`chip-status ${t.status === 'FAIL' ? 'chip-fail' : 'chip-pass'}`}>{t.status || '—'}</span>
                </span>
                <span className="chip-jiraid">{t.jiraId}</span>
                <span className="chip-source">Source: {t.requirementSource === 'LOCAL_PROMPT_FALLBACK' ? 'Local Prompt' : t.requirementSource === 'PLACEHOLDER' ? 'Placeholder' : 'JIRA'}</span>
              </button>
            ))}
            {tickets.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>No execution results yet. Run the orchestrator to see data here.</div>}
          </div>

          <div className="main-content">
            {/* Selected ticket detail */}
            <section className="execution-pannel">
              {activeTicket ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                        {activeTicket.jiraId}
                      </h2>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>
                        {activeTicket.title}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span className="mini-badge">
                        <FileSpreadsheet size={14} color="#38bdf8" />
                        <span className="badge-label">Total Test Cases:</span> {activeTicket.results.length}
                      </span>
                      {activeTicket.timestamp && <span className="mini-badge"><Clock size={14} color="#94a3b8" /> {new Date(activeTicket.timestamp).toLocaleString()}</span>}
                    </div>
                  </div>

                  <div className="ticket-summary">
                    <SummaryBox label="Passed" value={activeTicket.passed} color="#34d399" />
                    <SummaryBox label="Failed" value={activeTicket.failed} color="#fb7185" />
                    <SummaryBox label="Total" value={activeTicket.total} color="#818cf8" />
                  </div>

                  <div className="testcase-table-wrap">
                    <table className="testcase-table">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Test Case ID</th>
                          <th>Test Case Name</th>
                          <th>Type of Testing</th>
                          <th>Bug ID</th>
                          <th>Time Executed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTicket.results.map(tc => {
                          const bug = activeTicket.bugs.find(b => b.tcid === tc.tcid);
                          const perTest =
                            (activeTicket.insights && activeTicket.insights.insights && activeTicket.insights.insights[tc.tcid]) || null;
                          // Fall back to the ticket-level summary insight so the
                          // AI Insights block stays visible under failed tests.
                          const insight = perTest || (tc.status === 'FAIL' ? activeTicket.insights : null) || null;
                          return (
                            <React.Fragment key={tc.tcid}>
                              <tr className={tc.status === 'FAIL' ? 'table-row-fail' : ''}>
                                <td>
                                  <span className={`status-chip ${tc.status === 'PASS' ? 'status-chip-pass' : 'status-chip-fail'}`}>
                                    {tc.status}
                                  </span>
                                </td>
                                <td className="cell-id">{tc.tcid}</td>
                                <td className="cell-name">{tc.summary || '—'}</td>
                                <td>
                                  <span className="mini-badge">{String(tc.tcid).includes('API') ? 'API' : 'UI'}</span>
                                </td>
                                <td>
                                  {bug ? (
                                    <span className="bug-inline">
                                      <Bug size={12} color="#fb7185" />
                                      {bug.bugId}
                                      {bug.jiraUrl && <a href={bug.jiraUrl} target="_blank" rel="noreferrer" className="bug-link">Open ↗</a>}
                                    </span>
                                  ) : (
                                    <span className="cell-muted">—</span>
                                  )}
                                </td>
                                <td className="cell-duration">{tc.duration || '—'}</td>
                              </tr>
                              {insight && (
                                <tr className="table-row-insight">
                                  <td colSpan={6}>
                                    <div className="insight-block">
                                      <div className="insight-block-label">
                                        <Terminal size={13} color="#a5b4fc" />
                                        AI Insights {bug ? `- ${bug.bugId}` : `- ${tc.tcid}`}
                                      </div>
                                      <div className="insight-line">
                                        <span className="insight-tag">{insight.rootCause ? 'Root Cause' : 'Summary'}</span>
                                        <span>{insight.rootCause || insight.summary || 'No root cause identified.'}</span>
                                      </div>
                                      {insight.suggestion && (
                                        <div className="insight-line">
                                          <span className="insight-tag">Suggestion</span>
                                          <span>{insight.suggestion}</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                    {activeTicket.results.length === 0 && (
                      <div style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>No individual test case results recorded.</div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>
                  Select a ticket to see execution details.
                </div>
              )}
            </section>

            <aside className="insights-panel">
              <div className="execution-pannel" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '1rem' }}>
                  <BarChart3 size={20} color="#818cf8" />
                  Execution Summary
                </h2>
                {activeTicket ? (
                  <>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Passed', value: activeTicket.passed || 0 },
                              { name: 'Failed', value: activeTicket.failed || 0 },
                            ]}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            stroke="none"
                          >
                            <Cell fill="#34d399" />
                            <Cell fill="#fb7185" />
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '0.8rem' }}
                            itemStyle={{ color: '#e2e8f0' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#b6c0d1' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff' }}>
                        {activeTicket.total ? Math.round((activeTicket.passed / activeTicket.total) * 100) : 0}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Pass Rate
                      </div>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-around', gap: '0.5rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>{activeTicket.passed || 0}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Passed</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fb7185' }}>{activeTicket.failed || 0}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Failed</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#818cf8' }}>{activeTicket.total || 0}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                    No execution data yet.
                  </div>
                )}
              </div>

              <div className="execution-pannel" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '1rem' }}>
                  <Activity size={20} color="#818cf8" />
                  Live Execution Stream
                </h2>
                <div className="logs-list" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  <AnimatePresence initial={false}>
                    {data.recentLogs.map((log, i) => (
                      <motion.div
                        key={`${log}-${i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="log-entry"
                      >
                        <div className="log-timestamp">{new Date().toLocaleTimeString()}</div>
                        <div className="log-message">{log}</div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {data.recentLogs.length === 0 && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Waiting for live events… (run <code style={{ color: '#818cf8' }}>node scripts/orchestrate.js SCRUM-10</code> to stream)
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) => (
  <div className="stat-card">
    <div className="stat-header">
      {icon}
      <span className="stat-label">{label}</span>
    </div>
    <div className="stat-value">{value}</div>
  </div>
);

const SummaryBox = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="summary-box">
    <div className="summary-value" style={{ color }}>{value}</div>
    <div className="summary-label">{label}</div>
  </div>
);

export default App;
