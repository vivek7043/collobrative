import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const Dashboard = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('home'); // 'home', 'create', 'join'
    const [joinId, setJoinId] = useState('');
    const [userName, setUserName] = useState('');
    const [generatedId] = useState(uuidv4());

    const handleJoin = () => {
        if (joinId.trim() && userName.trim()) {
            navigate(`room/${joinId.trim()}`, { state: { userName: userName.trim() } });
        } else {
            alert('Please enter both Room ID and Your Name');
        }
    };

    const handleStartCreatedRoom = () => {
        if (userName.trim()) {
            navigate(`room/${generatedId}`, { state: { userName: userName.trim() } });
        } else {
            alert('Please enter your name first');
        }
    };

    const copyInviteLink = () => {
        const link = window.location.origin + "/room/" + generatedId;
        navigator.clipboard.writeText(link);
        alert('Invite link copied to clipboard!');
    };

    const shareToWhatsApp = () => {
        const link = window.location.origin + "/room/" + generatedId;
        const text = `Join my collaborative workspace on Antigravity: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="dashboard-container">
            <div className="card glass-effect animate-in">
                <div className="card-header">
                    <h1>✨ Antigravity</h1>
                    <p>Real-time collaboration for the future.</p>
                </div>

                <div className="content-area">
                    {mode === 'home' && (
                        <div className="home-actions animate-in">
                            <button className="btn-primary main-btn" onClick={() => setMode('create')}>
                                <span>🚀</span> Create New Meeting
                            </button>
                            <div className="divider">OR</div>
                            <button className="btn-secondary main-btn" onClick={() => setMode('join')}>
                                <span>🤝</span> Join with ID
                            </button>
                        </div>
                    )}

                    {mode === 'create' && (
                        <div className="setup-section animate-in">
                            <h3>Setup your profile</h3>
                            <input
                                type="text"
                                placeholder="Enter your name..."
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="input-field large-input"
                                style={{ marginBottom: '20px' }}
                            />
                            <p style={{ fontSize: '0.9rem' }}>Share this unique Room ID to start collaborating.</p>
                            <div className="id-container">
                                <span className="generated-id">{generatedId.slice(0, 18)}...</span>
                                <button
                                    className="copy-btn"
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedId);
                                        alert('ID Copied to Clipboard!');
                                    }}
                                >
                                    Copy
                                </button>
                            </div>
                            <div className="action-row" style={{ flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <button className="copy-btn flex-1" onClick={copyInviteLink} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
                                        🔗 Copy Link
                                    </button>
                                    <button className="copy-btn flex-1" onClick={shareToWhatsApp} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                        💬 WhatsApp
                                    </button>
                                </div>
                                <button className="btn-primary" style={{ width: '100%', marginTop: '5px' }} onClick={handleStartCreatedRoom}>
                                    Enter Room
                                </button>
                                <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setMode('home')}>
                                    ← Back
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'join' && (
                        <div className="setup-section animate-in">
                            <h3>Join Meeting</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <input
                                    type="text"
                                    placeholder="Enter your name..."
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="input-field large-input"
                                />
                                <input
                                    type="text"
                                    placeholder="Paste Room ID here..."
                                    value={joinId}
                                    onChange={(e) => setJoinId(e.target.value)}
                                    className="input-field large-input"
                                />
                            </div>
                            <div className="action-row">
                                <button className="btn-primary flex-1" onClick={handleJoin}>
                                    Connect
                                </button>
                                <button className="btn-secondary" onClick={() => setMode('home')}>
                                    ←
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <style>{`
                    .flex-1 { flex: 1; }
                    .action-row { display: flex; gap: 10px; margin-top: 20px; }
                    .card-header h1 { margin-top: 0; }
                `}</style>
            </div>

            <div className="steps animate-in" style={{ animationDelay: '0.2s' }}>
                <div className="step-card">
                    <span className="step-icon">🔒</span>
                    <h3>Secure</h3>
                    <p>End-to-end encrypted rooms.</p>
                </div>
                <div className="step-card">
                    <span className="step-icon">⚡</span>
                    <h3>Fast</h3>
                    <p>Low latency P2P video call.</p>
                </div>
                <div className="step-card">
                    <span className="step-icon">🎨</span>
                    <h3>Creative</h3>
                    <p>Rich whiteboard & code editor.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
