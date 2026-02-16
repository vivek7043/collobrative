import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';

const Whiteboard = ({ socketRef, roomId, activeView, isAdmin }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const fabricCanvasRef = useRef(null);

    // --- Initialization & Socket Listeners ---
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        let { clientWidth, clientHeight } = container;

        if (clientWidth === 0) clientWidth = window.innerWidth;
        if (clientHeight === 0) clientHeight = 500;

        const canvas = new fabric.Canvas(canvasRef.current, {
            isDrawingMode: isAdmin,
            width: clientWidth,
            height: clientHeight,
            backgroundColor: 'white',
            allowTouchScrolling: false,
            enableRetinaScaling: true
        });
        fabricCanvasRef.current = canvas;

        // Force touch action to none on the fabric generated containers
        const fabricContainer = canvas.getElement().parentNode;
        if (fabricContainer) {
            fabricContainer.style.touchAction = 'none';
        }

        canvas.freeDrawingBrush.width = 5;
        canvas.freeDrawingBrush.color = "black";

        // If not admin, disable pointer events on the canvas too
        if (!isAdmin) {
            canvas.selection = false;
            canvas.forEachObject(obj => {
                obj.selectable = false;
                obj.evented = false;
            });
        }

        const handleCanvasData = (data) => {
            canvas.loadFromJSON(data, () => {
                canvas.renderAll();
                canvas.calcOffset();
            });
        };

        const handleClearCanvas = () => {
            canvas.clear();
            canvas.backgroundColor = 'white';
            canvas.renderAll();
            canvas.calcOffset();
        };

        if (socketRef.current) {
            socketRef.current.on('canvas-data', handleCanvasData);
            socketRef.current.on('clear-canvas', handleClearCanvas);
        }

        canvas.on('path:created', () => {
            if (isAdmin && socketRef.current) {
                socketRef.current.emit('canvas-data', { roomId, data: canvas.toJSON() });
            }
        });

        // Ensure canvas is correctly positioned for touch events
        canvas.calcOffset();

        return () => {
            canvas.dispose();
            if (socketRef.current) {
                socketRef.current.off('canvas-data', handleCanvasData);
                socketRef.current.off('clear-canvas', handleClearCanvas);
            }
        };
    }, [roomId, socketRef, isAdmin]);

    // --- Dynamic Resizing ---
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && fabricCanvasRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                if (clientWidth > 0 && clientHeight > 0) {
                    const canvas = fabricCanvasRef.current;
                    canvas.setWidth(clientWidth);
                    canvas.setHeight(clientHeight);
                    canvas.renderAll();
                    canvas.calcOffset();
                }
            }
        };

        if (activeView === 'whiteboard') {
            const timer = setTimeout(handleResize, 100);
            return () => clearTimeout(timer);
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeView]);

    const clearBoard = () => {
        if (!isAdmin) return;
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.clear();
            fabricCanvasRef.current.backgroundColor = 'white';
            fabricCanvasRef.current.renderAll();
            fabricCanvasRef.current.calcOffset();
        }
        if (socketRef.current) {
            socketRef.current.emit('clear-canvas', { roomId });
        }
    };

    return (
        <div className="whiteboard-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', touchAction: 'none' }}>
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'white',
                    overflow: 'hidden',
                    width: '100%',
                    height: '100%',
                    touchAction: 'none'
                }}
            >
                <canvas ref={canvasRef} />
            </div>

            {/* Admin Overlay / Notice for non-admins */}
            {!isAdmin && (
                <div style={{
                    position: 'absolute',
                    top: '15px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    border: '1px solid var(--border-color)',
                    zIndex: 10,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ color: 'var(--primary-color)' }}>🔒</span> Admin Only: View Mode
                </div>
            )}

            {/* Compact Floating Clear Button */}
            {isAdmin && (
                <button
                    onClick={clearBoard}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        backdropFilter: 'blur(8px)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                >
                    <span style={{ fontSize: '0.9rem' }}>🗑️</span> Clear
                </button>
            )}
        </div>
    );
};

export default Whiteboard;
