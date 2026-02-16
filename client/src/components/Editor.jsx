import React, { useEffect, useState, useRef } from 'react';

const Editor = ({ socketRef, roomId, participants }) => {
    const [content, setContent] = useState('');
    const [cursors, setCursors] = useState({});
    const textareaRef = useRef(null);

    useEffect(() => {
        if (!socketRef.current) return;

        socketRef.current.on('receive-changes', (data) => {
            setContent(data);
        });

        socketRef.current.on('cursor-update', ({ userId, cursor }) => {
            setCursors(prev => ({ ...prev, [userId]: cursor }));
        });

        return () => {
            socketRef.current.off('receive-changes');
            socketRef.current.off('cursor-update');
        };
    }, [socketRef.current]);

    const handleChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        if (socketRef.current) {
            socketRef.current.emit('send-changes', { roomId, content: newContent });
        }
    };

    const handleSelect = (e) => {
        const cursor = {
            index: e.target.selectionStart,
        };
        if (socketRef.current) {
            socketRef.current.emit('cursor-move', { roomId, cursor });
        }
    };

    const renderCursors = () => {
        return Object.entries(cursors).map(([userId, cursor]) => (
            <div key={userId} style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(100, 108, 255, 0.2)',
                color: '#aaa',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                pointerEvents: 'none'
            }}>
                User {participants[userId] || userId.substr(0, 4)} is active
            </div>
        ));
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onSelect={handleSelect}
                style={{ width: '100%', height: '100%', padding: '20px', fontFamily: 'monospace', fontSize: '16px', background: '#1e1e1e', color: '#fff', border: 'none', resize: 'none' }}
                placeholder="Start collaborating..."
            />
            {renderCursors()}
        </div>
    );
};

export default Editor;
