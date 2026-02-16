import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';

const Whiteboard = ({ socketRef, roomId, activeView }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const fabricCanvasRef = useRef(null);

    // --- Initialization & Socket Listeners ---
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        let { clientWidth, clientHeight } = container;

        // If hidden initially, use a reasonable default. 
        // handleResize will correct this as soon as activeView === 'whiteboard'.
        if (clientWidth === 0) clientWidth = window.innerWidth;
        if (clientHeight === 0) clientHeight = 500;

        const canvas = new fabric.Canvas(canvasRef.current, {
            isDrawingMode: true,
            width: clientWidth,
            height: clientHeight,
            backgroundColor: 'white'
        });
        fabricCanvasRef.current = canvas;

        canvas.freeDrawingBrush.width = 5;
        canvas.freeDrawingBrush.color = "black";

        const handleCanvasData = (data) => {
            canvas.loadFromJSON(data, () => {
                canvas.renderAll();
            });
        };

        const handleClearCanvas = () => {
            canvas.clear();
            canvas.backgroundColor = 'white';
            canvas.renderAll();
        };

        if (socketRef.current) {
            socketRef.current.on('canvas-data', handleCanvasData);
            socketRef.current.on('clear-canvas', handleClearCanvas);
        }

        canvas.on('path:created', () => {
            if (socketRef.current) {
                socketRef.current.emit('canvas-data', { roomId, data: canvas.toJSON() });
            }
        });

        return () => {
            canvas.dispose();
            if (socketRef.current) {
                socketRef.current.off('canvas-data', handleCanvasData);
                socketRef.current.off('clear-canvas', handleClearCanvas);
            }
        };
    }, [roomId, socketRef]);

    // --- Dynamic Resizing ---
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && fabricCanvasRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                if (clientWidth > 0 && clientHeight > 0) {
                    const canvas = fabricCanvasRef.current;
                    // Update dimensions without clearing content
                    canvas.setWidth(clientWidth);
                    canvas.setHeight(clientHeight);
                    canvas.renderAll();
                    // Optional: calcOffset to ensure drawing coordinates align
                    canvas.calcOffset();
                }
            }
        };

        if (activeView === 'whiteboard') {
            // Small delay to ensure the DOM has finished its "display: flex/block" transition
            setTimeout(handleResize, 100);
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeView]);

    const clearBoard = () => {
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.clear();
            fabricCanvasRef.current.backgroundColor = 'white';
            fabricCanvasRef.current.renderAll();
        }
        if (socketRef.current) {
            socketRef.current.emit('clear-canvas', { roomId });
        }
    };

    return (
        <div className="whiteboard-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
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
                    height: '100%'
                }}
            >
                <canvas ref={canvasRef} />
            </div>

            {/* Compact Floating Clear Button */}
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
        </div>
    );
};

export default Whiteboard;
