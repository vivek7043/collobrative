import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useNotification } from '../context/NotificationContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('home'); // 'home', 'create', 'join'
    const [joinId, setJoinId] = useState('');
    const [userName, setUserName] = useState('');
    const [generatedId] = useState(uuidv4());
    const notify = useNotification();

    const quotes = useMemo(() => [
        "Intelligence is the ability to adapt to change. — Utsav Bhut",
        "The mind is not a vessel to be filled, but a fire to be kindled. — Plutarch",
        "Excellence is not an act, but a habit. — Aristotle",
        "The best way to predict your future is to create it. — Peter Drucker",
        "Knowledge is power. Information is liberating. — Utsav Bhut"
    ], []);

    const currentQuote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], [quotes]);

    const handleJoin = () => {
        if (joinId.trim() && userName.trim()) {
            navigate(`room/${joinId.trim()}`, { state: { userName: userName.trim() } });
        } else {
            notify('Please enter both Room ID and Your Name', 'warning');
        }
    };

    const handleStartCreatedRoom = () => {
        if (userName.trim()) {
            navigate(`room/${generatedId}`, { state: { userName: userName.trim() } });
        } else {
            notify('Please enter your name first', 'warning');
        }
    };

    const copyInviteLink = () => {
        const link = window.location.origin + "/room/" + generatedId;
        navigator.clipboard.writeText(link);
        notify('Invite link copied to clipboard!', 'success');
    };

    const shareToWhatsApp = () => {
        const link = window.location.origin + "/room/" + generatedId;
        const text = `Join my exclusive GLS University workspace: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="dashboard-container">
            <div className="card animate-in">
                <div className="card-header">
                    <h1 className="serif">GLS UNIVERSITY</h1>
                    <p className="tagline">Collaborative Intelligence</p>
                </div>

                <div className="content-area">
                    {mode === 'home' && (
                        <div className="home-actions animate-in">
                            <div className="quote-section">
                                <p style={{ margin: 0, color: '#d4af37', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Insight</p>
                                "{currentQuote}"
                            </div>
                            <button className="btn-primary main-btn" onClick={() => setMode('create')}>
                                <i className="fas fa-crown"></i> Create Executive Room
                            </button>
                            <div className="divider">DISTINCTION THROUGH COLLABORATION</div>
                            <button className="btn-secondary main-btn" onClick={() => setMode('join')}>
                                <i className="fas fa-signature"></i> Enter Workspace
                            </button>
                        </div>
                    )}

                    {mode === 'create' && (
                        <div className="setup-section animate-in">
                            <h3 className="serif">Member Entry</h3>
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="input-field"
                                style={{ marginBottom: '20px' }}
                            />
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Secure an invitation link for your associates.</p>
                            <div className="id-container">
                                <span className="generated-id">{generatedId.slice(0, 18)}...</span>
                                <button
                                    className="copy-btn"
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedId);
                                        notify('ID Copied to Clipboard!', 'success');
                                    }}
                                >
                                    Copy
                                </button>
                            </div>
                            <div className="action-row" style={{ flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                    <button className="copy-btn flex-1" onClick={copyInviteLink}>
                                        <i className="fas fa-link"></i> Link
                                    </button>
                                    <button className="copy-btn flex-1" onClick={shareToWhatsApp} style={{ borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
                                        <i className="fab fa-whatsapp"></i> Notify
                                    </button>
                                </div>
                                <button className="btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={handleStartCreatedRoom}>
                                    Initialize Workspace
                                </button>
                                <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setMode('home')}>
                                    Return
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'join' && (
                        <div className="setup-section animate-in">
                            <h3 className="serif">Join Suite</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="input-field"
                                />
                                <input
                                    type="text"
                                    placeholder="Room ID"
                                    value={joinId}
                                    onChange={(e) => setJoinId(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div className="action-row">
                                <button className="btn-primary flex-1" onClick={handleJoin}>
                                    Connect
                                </button>
                                <button className="btn-secondary" onClick={() => setMode('home')}>
                                    <i className="fas fa-arrow-left"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <style>{`
                    .flex-1 { flex: 1; }
                    .action-row { display: flex; gap: 10px; margin-top: 25px; }
                    .card-header h1 { margin-top: 0; }
                `}</style>
            </div>

            <div className="steps animate-in" style={{ animationDelay: '0.2s' }}>
                <div className="step-card">
                    <span className="step-icon">⚜️</span>
                    <h3>Elite Security</h3>
                    <p>Encrypted, peer-to-peer vaults for your intellectual property.</p>
                </div>
                <div className="step-card">
                    <span className="step-icon">⚡</span>
                    <h3>High Performance</h3>
                    <p>Sub-millisecond latency for real-time strategic alignment.</p>
                </div>
                <div className="step-card">
                    <span className="step-icon">💎</span>
                    <h3>Curated Tools</h3>
                    <p>Whiteboards and editors designed for sophisticated learning.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
