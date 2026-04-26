import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Activity, CheckCircle, XCircle, RefreshCw, BarChart3, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const socket = io('http://localhost:5000');

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

  useEffect(() => {
    socket.on('status_changed', (message: any) => {
      if (message.type === 'DATA_UPDATE') {
        setData(prev => ({ 
          ...prev, 
          ...message.data,
          recentLogs: [...message.data.recentLogs || [], ...prev.recentLogs].slice(0, 10)
        }));
      } else if (message.type === 'STATUS_UPDATE') {
        setData(prev => ({ ...prev, agentStatus: message.status }));
      }
    });

    return () => {
      socket.off('status_changed');
    };
  }, []);

  return (
    <div className="dashboard-container">
      <div className="bg-glow">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
      </div>

      <header>
        <div>
          <h1>Antigravity AI</h1>
          <div className="subtitle">
            <div className="pulse"></div>
            Orchestration Dashboard • v1.0.0
          </div>
        </div>

        <div className="agent-badge">
          <div className={`status-dot ${data.agentStatus === 'Error occurred' ? 'status-error' : ''}`}></div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            AI Agent: <span style={{ color: 'white', fontStyle: 'italic' }}>{data.agentStatus}</span>
          </span>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard icon={<BarChart3 size={20} color="#818cf8" />} label="Total Executed" value={data.totalTests} />
        <StatCard icon={<CheckCircle size={20} color="#34d399" />} label="Total Passed" value={data.passed} />
        <StatCard icon={<XCircle size={20} color="#fb7185" />} label="Total Failed" value={data.failed} />
        <StatCard icon={<RefreshCw size={20} color="#38bdf8" />} label="Self Healed" value={data.healed} />
      </div>

      <div className="main-content">
        <section className="execution-pannel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Activity size={20} color="#818cf8" />
              Live Execution Stream
            </h2>
          </div>
          
          <div className="logs-list">
            <AnimatePresence initial={false}>
              {data.recentLogs.map((log, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="log-entry"
                >
                  <div className="log-timestamp">{new Date().toLocaleTimeString()}</div>
                  <div className="log-message">{log}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <aside className="insights-panel">
          <div className="insight-card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '1rem' }}>
              <Terminal size={20} color="#818cf8" />
              AI Insights
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 700, margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>Root Cause Analysis</p>
                <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: 0 }}>
                  {data.failed > 0 
                    ? "Detected DOM structure change in OrangeHRM Profile module. Nickname field locator failed."
                    : "System performance is optimal. No critical failures detected."}
                </p>
              </div>
              
              {data.failed > 0 && (
                <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
                  <p style={{ fontSize: '0.7rem', color: '#c7d2fe', fontWeight: 700, margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>Healing Suggestion</p>
                  <p style={{ fontSize: '0.875rem', color: '#e0e7ff', margin: 0, fontStyle: 'italic' }}>
                    "Switch to data-testid or custom attribute mapping for resilient locators."
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
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

export default App;
