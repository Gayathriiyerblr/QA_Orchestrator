import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [data, setData] = useState({
    totalTests: 0,
    passed: 0,
    failed: 0,
    healed: 0,
    agentStatus: 'Waiting...',
    recentLogs: []
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'DATA_UPDATE') {
        setData(prev => ({ ...prev, ...message.data }));
      } else if (message.type === 'STATUS_UPDATE') {
        setData(prev => ({ ...prev, agentStatus: message.status }));
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Antigravity AI<span style={styles.subtitle}>QA Orchestration</span></h1>
        <div style={styles.agentStatus}>
          <div style={{ ...styles.pulse, backgroundColor: data.agentStatus === 'Active' ? '#4ade80' : '#94a3b8' }}></div>
          Agent Status: {data.agentStatus}
        </div>
      </header>

      <div style={styles.grid}>
        <Card title="Total" value={data.totalTests} color="#38bdf8" />
        <Card title="Passed" value={data.passed} color="#4ade80" />
        <Card title="Failed" value={data.failed} color="#f87171" />
        <Card title="Self-Healed" value={data.healed} color="#818cf8" />
      </div>

      <div style={styles.logContainer}>
        <h3 style={styles.logTitle}>Live Execution Logs</h3>
        <div style={styles.logBox}>
          {data.recentLogs.map((log, i) => (
            <div key={i} style={styles.logEntry}>
              <span style={styles.timestamp}>[{new Date().toLocaleTimeString()}]</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, value, color }) => (
  <div style={styles.card}>
    <div style={styles.cardLabel}>{title}</div>
    <div style={{ ...styles.cardValue, color }}>{value}</div>
  </div>
);

const styles = {
  container: { backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '40px', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  title: { fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { marginLeft: '10px', fontSize: '1rem', color: '#94a3b8', WebkitTextFillColor: '#94a3b8' },
  agentStatus: { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '30px' },
  pulse: { width: '12px', height: '12px', borderRadius: '50%', boxShadow: '0 0 10px rgba(74,222,128,0.5)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' },
  card: { background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', borderRadius: '24px', textAlign: 'center' },
  cardLabel: { fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' },
  cardValue: { fontSize: '3rem', fontWeight: '800' },
  logContainer: { background: 'rgba(30, 41, 59, 0.7)', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' },
  logTitle: { marginBottom: '20px', fontWeight: '600' },
  logBox: { height: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9rem' },
  logEntry: { marginBottom: '8px', color: '#cbd5e1' },
  timestamp: { color: '#38bdf8', marginRight: '10px' }
};

export default Dashboard;
