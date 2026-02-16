import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Editor from '../components/Editor';
import Whiteboard from '../components/Whiteboard';
import VideoCall from '../components/VideoCall';
import { useLocation } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';

const Room = () => {
    const { id: roomId } = useParams();
    const location = useLocation();
    const [socket, setSocket] = useState(null);
    const [userName, setUserName] = useState(location.state?.userName || '');
    const [showNamePrompt, setShowNamePrompt] = useState(!location.state?.userName);
    const notify = useNotification();
    const [activeView, setActiveView] = useState('editor'); // 'editor', 'whiteboard'
    const [joined, setJoined] = useState(false);
    const [participants, setParticipants] = useState({}); // { socketId: name }
    const [emojis, setEmojis] = useState([]);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!userName) return; // Wait for name prompt if needed

        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const s = io(socketUrl);
        socketRef.current = s;
        setSocket(s);

        s.on('connect', () => {
            console.log("Socket connected:", s.id);
            s.emit('join-room', roomId, userName);
            setJoined(true);
            setParticipants(prev => ({ ...prev, [s.id]: userName }));
        });

        s.on('user-connected', (userId, name) => {
            console.log(`User ${name} joined room`);
            setParticipants(prev => ({ ...prev, [userId]: name }));
        });

        s.on('view-update', (newView) => {
            setActiveView(newView);
        });

        s.on('receive-emoji', (emoji) => {
            addFloatingEmoji(emoji);
        });

        s.on('user-disconnected', userId => {
            setParticipants(prev => {
                const newParticipants = { ...prev };
                delete newParticipants[userId];
                return newParticipants;
            });
        });

        return () => {
            s.disconnect();
            s.off('view-update');
            s.off('receive-emoji');
            s.off('user-connected');
            s.off('user-disconnected');
        };
    }, [roomId, userName, showNamePrompt]);

    const addFloatingEmoji = (emoji) => {
        const id = Date.now() + Math.random();
        setEmojis(prev => [...prev, { id, emoji, style: { left: Math.random() * 50 + '%' } }]);
        setTimeout(() => {
            setEmojis(prev => prev.filter(e => e.id !== id));
        }, 2000);
    };

    const handleSendEmoji = (emoji) => {
        addFloatingEmoji(emoji);
        if (socket) {
            socket.emit('send-emoji', { roomId, emoji });
        }
    };

    const copyRoomLink = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link);
        notify('Room link copied to clipboard!', 'success');
    };

    const handleViewChange = (viewName) => {
        setActiveView(viewName);
        if (socket) {
            socket.emit('view-change', { roomId, view: viewName });
        }
    };

    const navButtonStyle = (viewName) => ({
        padding: '12px 16px',
        width: '100%',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: '600',
        marginBottom: '8px',
        backgroundColor: activeView === viewName ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
        color: 'white',
        border: activeView === viewName ? 'none' : '1px solid var(--border-color)',
        borderRadius: '12px',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s',
        boxShadow: activeView === viewName ? '0 4px 12px var(--primary-glow)' : 'none'
    });

    return (
        <div className="room-page-wrapper">

            {/* Username Prompt Overlay */}
            {showNamePrompt && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 1000,
                    background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ maxWidth: '450px', width: '90%', padding: '50px', textAlign: 'center' }}>
                        <h1 className="serif" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', marginBottom: '10px' }}>GLS UNIVERSITY</h1>
                        <p style={{ color: '#94a3b8', marginBottom: '30px', fontSize: '1rem', letterSpacing: '1px' }}>Elevate your intellectual collaboration.</p>
                        <input
                            type="text"
                            placeholder="Your Name"
                            className="input-field"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && userName.trim() && setShowNamePrompt(false)}
                            autoFocus
                        />
                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '30px', padding: '18px' }}
                            onClick={() => userName.trim() && setShowNamePrompt(false)}
                        >
                            Initialize Session
                        </button>
                    </div>
                </div>
            )}

            <div className="room-content">
                {/* Sidebar (Editor / Whiteboard - Optimized for Height) */}
                <div className="left-panel">

                    {/* Tools Header - Compact */}
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={{ ...navButtonStyle('editor'), marginBottom: 0, padding: '8px 12px', width: 'auto' }} onClick={() => handleViewChange('editor')}>
                                <span style={{ fontSize: '1.1rem' }}>📝</span> Editor
                            </button>
                            <button style={{ ...navButtonStyle('whiteboard'), marginBottom: 0, padding: '8px 12px', width: 'auto' }} onClick={() => handleViewChange('whiteboard')}>
                                <span style={{ fontSize: '1.1rem' }}>🎨</span> Whiteboard
                            </button>
                        </div>
                    </div>

                    {/* Active Tool View - Full Height */}
                    <div className="tool-viewport" style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '0' }}>
                        <div style={{ height: '100%', overflow: 'hidden' }}>
                            {socket && (
                                <>
                                    <div style={{ display: activeView === 'editor' ? 'block' : 'none', height: '100%' }}>
                                        <Editor socketRef={socketRef} roomId={roomId} participants={participants} />
                                    </div>
                                    <div style={{ display: activeView === 'whiteboard' ? 'block' : 'none', height: '100%' }}>
                                        <Whiteboard socketRef={socketRef} roomId={roomId} activeView={activeView} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Info & Reactions Footer - Compact */}
                    <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>ID:</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{roomId.slice(0, 8)}...</span>
                            </div>
                            <button onClick={copyRoomLink} style={{ padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}>Invite</button>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {['👍', '😂', '😮', '😢'].map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleSendEmoji(emoji)}
                                        style={{ fontSize: '1.3rem', padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 5px' }} />
                            <button
                                onClick={() => {
                                    if (socket) socket.disconnect();
                                    window.location.href = '/';
                                }}
                                style={{ padding: '8px 12px', flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => { e.target.style.background = '#ef4444'; e.target.style.color = '#fff'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.1)'; e.target.style.color = '#ef4444'; }}
                            >
                                Exit
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Panel (Video / Screen Share - Big) */}
                <div className="main-panel">
                    {joined && socket && (
                        <VideoCall socket={socket} roomId={roomId} userName={userName} participants={participants} setParticipants={setParticipants} />
                    )}

                    {/* Floating Emojis Overlay */}
                    <div style={{ position: 'absolute', bottom: '30px', right: '30px', pointerEvents: 'none', width: '200px', height: '500px', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse' }}>
                        {emojis.map(e => (
                            <div key={e.id} style={{ fontSize: '3.5rem', animation: 'floatUp 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards', alignSelf: 'center', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))', ...e.style }}>
                                {e.emoji}
                            </div>
                        ))}
                        <style>
                            {`
                            @keyframes floatUp {
                                0% { opacity: 0; transform: translateY(100px) scale(0.3) rotate(-20deg); }
                                20% { opacity: 1; transform: translateY(0) scale(1.2) rotate(0deg); }
                                80% { opacity: 0.8; transform: translateY(-250px) scale(1) rotate(10deg); }
                                100% { opacity: 0; transform: translateY(-400px) scale(0.8) rotate(20deg); }
                            }
                        `}
                        </style>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Room;
