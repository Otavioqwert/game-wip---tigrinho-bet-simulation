import React, { useState, useCallback, useRef } from 'react';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 10;
const CLICK_DRAG_THRESHOLD = 5; // Pixels to move before it's considered a drag

export const usePanAndZoom = () => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isGrabbing, setIsGrabbing] = useState(false);
    const [isPanModeActive, setIsPanModeActive] = useState(false);
    
    // Using a single ref for the entire pan state to avoid stale closures
    const panState = useRef({
        isPanning: false,
        isMouseDown: false,
        startPos: { x: 0, y: 0 },
        lastPos: { x: 0, y: 0 },
    });

    const resetPan = useCallback(() => {
        setOffset({ x: 0, y: 0 });
    }, []);

    const togglePanMode = useCallback(() => {
        setIsPanModeActive(prev => {
            if (prev) { // If turning off pan mode
                setIsGrabbing(false);
                panState.current.isMouseDown = false;
                panState.current.isPanning = false;
            }
            return !prev;
        });
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const zoomFactor = 1.1;
        
        const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
        const clampedScale = Math.min(Math.max(newScale, MIN_ZOOM), MAX_ZOOM);

        if (clampedScale === scale) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newOffsetX = mouseX - (mouseX - offset.x) * (clampedScale / scale);
        const newOffsetY = mouseY - (mouseY - offset.y) * (clampedScale / scale);

        setScale(clampedScale);
        
        if (clampedScale <= 1 && scale > 1) { 
            resetPan();
        } else if (clampedScale > 1) {
            setOffset({ x: newOffsetX, y: newOffsetY });
        }
    }, [scale, offset, resetPan]);
    
    const startPan = (point: { clientX: number, clientY: number }) => {
        if (scale <= 1) return;
        panState.current.isMouseDown = true;
        panState.current.startPos = { x: point.clientX, y: point.clientY };
        panState.current.lastPos = { x: point.clientX, y: point.clientY };
        setIsGrabbing(true);
    };

    const handlePan = (point: { clientX: number, clientY: number }) => {
        if (!panState.current.isMouseDown) return;

        if (!panState.current.isPanning) {
            const movedX = Math.abs(point.clientX - panState.current.startPos.x);
            const movedY = Math.abs(point.clientY - panState.current.startPos.y);
            if (movedX > CLICK_DRAG_THRESHOLD || movedY > CLICK_DRAG_THRESHOLD) {
                panState.current.isPanning = true;
            }
        }
        
        if (panState.current.isPanning) {
            const dx = point.clientX - panState.current.lastPos.x;
            const dy = point.clientY - panState.current.lastPos.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        }

        panState.current.lastPos = { x: point.clientX, y: point.clientY };
    };

    const endPan = () => {
        panState.current.isMouseDown = false;
        panState.current.isPanning = false;
        setIsGrabbing(false);
    };
    
    const panHandlers = {
        onWheel: handleWheel,
        onMouseDown: (e: React.MouseEvent) => {
            if (!isPanModeActive || e.button !== 0 || (e.target as HTMLElement).closest('button, a, input')) return;
            e.preventDefault();
            startPan(e);
        },
        onMouseMove: (e: React.MouseEvent) => {
            if (!isPanModeActive) return;
            handlePan(e);
        },
        onMouseUp: (e: React.MouseEvent) => {
            if (!isPanModeActive || e.button !== 0) return;
            endPan();
        },
        onMouseLeave: () => {
            if (!isPanModeActive) return;
            endPan();
        },
        onTouchStart: (e: React.TouchEvent) => {
            if (!isPanModeActive || (e.target as HTMLElement).closest('button, a, input')) return;
            if (scale <= 1) return; // Allow tab swipe when not zoomed
            if (e.touches.length === 1) {
                startPan(e.touches[0]);
            }
        },
        onTouchMove: (e: React.TouchEvent) => {
            if (!isPanModeActive) return;
            if (e.touches.length === 1) {
                handlePan(e.touches[0]);
            }
        },
        onTouchEnd: () => {
            if (!isPanModeActive) return;
            endPan();
        },
    };
    
    const zoomIn = useCallback(() => setScale(s => Math.min(s * 1.25, MAX_ZOOM)), []);
    const zoomOut = useCallback(() => {
        setScale(s => {
            const newScale = Math.max(s / 1.25, MIN_ZOOM);
            if (newScale <= 1) resetPan();
            return newScale;
        });
    }, [resetPan]);

    const style = {
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        cursor: isPanModeActive && scale > 1 ? (isGrabbing ? 'grabbing' : 'grab') : 'auto',
        touchAction: 'none',
        userSelect: isGrabbing ? 'none' : 'auto'
    } as const;

    return { style, scale, zoomIn, zoomOut, panHandlers, isPanModeActive, togglePanMode };
};