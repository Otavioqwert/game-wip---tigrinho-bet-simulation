
import React, { useState, useRef, useEffect, useCallback } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface VirtualJoystickProps {
    onDirectionChange: (dir: Direction) => void;
    size?: number;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onDirectionChange, size = 150 }) => {
    const [isActive, setIsActive] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const stickRef = useRef<HTMLDivElement>(null);
    const baseRef = useRef<HTMLDivElement>(null);
    const lastDirection = useRef<Direction | null>(null);

    const handleStart = () => {
        setIsActive(true);
    };

    const handleEnd = () => {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
        lastDirection.current = null;
    };

    const handleMove = useCallback((clientX: number, clientY: number) => {
        if (!baseRef.current) return;

        const rect = baseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        // Calculate distance and clamp to radius
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = size / 2;
        const clampedDistance = Math.min(distance, maxRadius);
        
        const angle = Math.atan2(dy, dx);
        const stickX = Math.cos(angle) * clampedDistance;
        const stickY = Math.sin(angle) * clampedDistance;

        setPosition({ x: stickX, y: stickY });

        // Determine Direction if moved enough (deadzone)
        if (distance > 20) {
            let newDir: Direction = 'RIGHT';
            
            // Simple quadrant logic
            if (Math.abs(dx) > Math.abs(dy)) {
                newDir = dx > 0 ? 'RIGHT' : 'LEFT';
            } else {
                newDir = dy > 0 ? 'DOWN' : 'UP';
            }

            if (newDir !== lastDirection.current) {
                lastDirection.current = newDir;
                onDirectionChange(newDir);
                // Haptic feedback if available
                if (navigator.vibrate) navigator.vibrate(10);
            }
        }
    }, [onDirectionChange, size]);

    // Touch Event Handlers
    const onTouchMove = (e: React.TouchEvent) => {
        // Prevent scrolling while using joystick
        if(e.cancelable) e.preventDefault(); 
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    // Mouse Event Handlers (for testing on desktop if needed)
    const onMouseMove = (e: React.MouseEvent) => {
        if (isActive) handleMove(e.clientX, e.clientY);
    };

    return (
        <div 
            className="relative flex items-center justify-center select-none touch-none"
            style={{ width: size, height: size }}
            ref={baseRef}
            onTouchStart={handleStart}
            onTouchMove={onTouchMove}
            onTouchEnd={handleEnd}
            onMouseDown={handleStart}
            onMouseMove={onMouseMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
        >
            {/* Base */}
            <div className="absolute inset-0 rounded-full bg-gray-800/50 border-4 border-gray-600 shadow-inner backdrop-blur-sm"></div>
            
            {/* Arrows Decoration */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-gray-500 font-bold text-xs">▲</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-500 font-bold text-xs">▼</div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">◀</div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">▶</div>

            {/* Stick */}
            <div 
                ref={stickRef}
                className={`absolute w-1/3 h-1/3 rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow-lg border-2 border-green-300 transition-transform duration-75 ${isActive ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ 
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)'
                }}
            >
                {/* Stick Gloss */}
                <div className="absolute top-1 left-2 right-2 h-1/2 bg-white/20 rounded-t-full blur-[1px]"></div>
            </div>
        </div>
    );
};

export default VirtualJoystick;
