import React, { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);

    const showNotification = useCallback((message, type = 'info') => {
        setNotification({ message, type });
        // Auto-hide after 3 seconds
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        </NotificationContext.Provider>
    );
};

const Toast = ({ message, type, onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success': return { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', color: '#4ade80' };
            case 'error': return { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', color: '#f87171' };
            case 'warning': return { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', color: '#fbbf24' };
            default: return { bg: 'rgba(99, 102, 241, 0.1)', border: '#818cf8', color: '#a5b4fc' };
        }
    };

    const colors = getColors();

    return (
        <div
            className="toast-container animate-toast-center"
            style={{
                position: 'fixed',
                top: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                background: 'rgba(2, 6, 23, 0.9)',
                backdropFilter: 'blur(20px)',
                padding: '18px 30px',
                borderRadius: '20px',
                border: `1px solid var(--primary-color)`,
                boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(6, 182, 212, 0.1)`,
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                width: 'min(90%, 500px)',
                color: 'white',
                cursor: 'pointer'
            }}
            onClick={onClose}
        >
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: colors.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.border,
                fontSize: '1.2rem'
            }}>
                <i className={`fas ${getIcon()}`}></i>
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.4' }}>{message}</p>
            </div>
            <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '5px' }}>
                <i className="fas fa-times"></i>
            </button>
        </div>
    );
};
