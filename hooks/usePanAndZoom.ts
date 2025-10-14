import React, { useState, useCallback, useRef } from 'react';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 10;
const PAN_SENSITIVITY = 0.8; // Reduced sensitivity for smoother movement
const CLICK_DRAG_THRESHOLD = 5; // Pixels to move before it's considered a drag

export const usePanAndZoom = () => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isGrabbing, setIsGrabbing] = useState(false);
    const isPanning = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 }); // Track initial mousedown position to differentiate click from drag

    const resetPan = useCallback(() => {
        setOffset({ x: 0, y: 0 });
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();

        // Determine if the cursor is in the top half of the screen
        const isTopHalf = e.clientY < window.innerHeight / 2;
        
        // Invert scroll direction for zoom if in the top half
        const scrollDirection = isTopHalf ? -Math.sign(e.deltaY) : Math.sign(e.deltaY);

        setScale(prev => {
            let newScale;
            // Negative scroll direction (scroll up in bottom, scroll down in top) zooms in
            if (scrollDirection < 0) {
                newScale = prev + 0.01;
            } 
            // Positive scroll direction (scroll down in bottom, scroll up in top) zooms out
            else if (scrollDirection > 0) {
                newScale = prev - 0.01;
            }
            else {
                return prev; // No scroll
            }

            const clampedScale = Math.min(Math.max(newScale, MIN_ZOOM), MAX_ZOOM);

            // Reset pan only when crossing the 1x threshold downwards to avoid unnecessary updates
            if (clampedScale <= 1 && prev > 1) { 
                resetPan();
            }
            
            return clampedScale;
        });
    }, [resetPan]);
    
    const startPan = (x: number, y: number) => {
        if (scale <= 1) return;
        isPanning.current = true;
        setIsGrabbing(true);
        lastPos.current = { x, y };
        startPos.current = { x, y };
    };

    const handlePan = (x: number, y: number) => {
        if (!isPanning.current) return;
        const dx = (x - lastPos.current.x) * PAN_SENSITIVITY;
        const dy = (y - lastPos.current.y) * PAN_SENSITIVITY;
        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPos.current = { x, y };
    };

    const endPan = () => {
        if (!isPanning.current) return;
        isPanning.current = false;
        setIsGrabbing(false);
    };
    
    const panHandlers = {
        onWheel: handleWheel,
        onMouseDown: (e: React.MouseEvent) => {
            // Pan with right mouse button (button === 2)
            if (e.button !== 2) return;
            if ((e.target as HTMLElement).closest('button, a, input')) return;
            startPan(e.clientX, e.clientY);
        },
        onMouseMove: (e: React.MouseEvent) => handlePan(e.clientX, e.clientY),
        onMouseUp: (e: React.MouseEvent) => {
            if (e.button !== 2) return;
            endPan();
        },
        onMouseLeave: endPan,
        onContextMenu: (e: React.MouseEvent) => {
            // Prevent context menu only if it was a drag, not a simple click
            const movedX = Math.abs(e.clientX - startPos.current.x);
            const movedY = Math.abs(e.clientY - startPos.current.y);
            if (movedX > CLICK_DRAG_THRESHOLD || movedY > CLICK_DRAG_THRESHOLD) {
                e.preventDefault();
            }
        },
        onTouchStart: (e: React.TouchEvent) => {
            if ((e.target as HTMLElement).closest('button, a, input')) return;
            if (scale <= 1) return; // Allow tab swipe when not zoomed
            if (e.touches.length === 1) {
                startPan(e.touches[0].clientX, e.touches[0].clientY)
            }
        },
        onTouchMove: (e: React.TouchEvent) => {
            if (e.touches.length === 1) {
                handlePan(e.touches[0].clientX, e.touches[0].clientY)
            }
        },
        onTouchEnd: endPan,
    };
    
    const zoomIn = useCallback(() => setScale(s => Math.min(s * 1.2, MAX_ZOOM)), []);
    const zoomOut = useCallback(() => {
        setScale(s => {
            const newScale = Math.max(s / 1.2, MIN_ZOOM);
            if (newScale <= 1) resetPan();
            return newScale;
        })
    }, [resetPan]);

    const transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
    const cursor = scale > 1 ? (isGrabbing ? 'grabbing' : 'grab') : 'auto';

    return { transform, scale, zoomIn, zoomOut, panHandlers, cursor };
};