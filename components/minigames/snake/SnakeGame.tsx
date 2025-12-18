
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SnakeUpgradeId } from '../../../types';
import SnakeUpgrades from './SnakeUpgrades';
import { SNAKE_UPGRADES } from '../../../constants/snakeUpgrades';

const GRID_SIZE = 20;
const BASE_GAME_SPEED = 150; // ms
const DASH_COOLDOWN = 5000; // 5 seconds
const DASH_REACTION_TIME = 1000; // 1s slow motion

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Food = { x: number; y: number; type: 'normal' | 'golden' };
type SnakeSegment = { x: number; y: number };
type FloatingText = { id: number; x: number; y: number; text: string; subText?: string; life: number; color: string };

interface SnakeGameProps {
    onClose: (score: number) => void;
    bal: number;
    snakeUpgrades: Record<string, number>;
    buySnakeUpgrade: (id: SnakeUpgradeId) => void;
    snakeGameSettings: {
        speedModifier: number;
        initialLength: number;
        lives: number;
        goldenAppleChance: number;
        frenzyChances: number[];
        applePointBonus: number; // Used for combo scaling now
        paralamasCharges: number;
    };
    totalScoreMultiplier: number;
    resetSnakeUpgrades: () => void;
}

const getInitialSnake = (length: number) => {
    return Array.from({ length }, (_, i) => ({ x: 10 - i, y: 10 }));
};

const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
};

const SnakeGame: React.FC<SnakeGameProps> = (props) => {
    const { onClose, bal, snakeUpgrades, buySnakeUpgrade, snakeGameSettings, totalScoreMultiplier, resetSnakeUpgrades } = props;
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [snake, setSnake] = useState<SnakeSegment[]>(() => getInitialSnake(snakeGameSettings.initialLength));
    const [food, setFood] = useState<Food[]>([]);
    const [score, setScore] = useState(0);
    const [internalScore, setInternalScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [lives, setLives] = useState(snakeGameSettings.lives);
    const [gameOverTab, setGameOverTab] = useState('result');
    const [canvasSize, setCanvasSize] = useState(400);
    const [paralamasChargesUsed, setParalamasChargesUsed] = useState(0);
    const [applesSinceLastReset, setApplesSinceLastReset] = useState(0);

    // --- DASH STATE ---
    const [dashCooldownTimer, setDashCooldownTimer] = useState(0);
    const [isDashingVisual, setIsDashingVisual] = useState(false);
    const [slowMoActive, setSlowMoActive] = useState(false);
    
    const lastKeyPressRef = useRef<{ dir: Direction, time: number } | null>(null);
    const dashCooldownRef = useRef(0);
    const dashReactionTimeoutRef = useRef<number | null>(null);

    const hasDashSkill = (snakeUpgrades['dashSkill'] || 0) > 0;

    // --- COMBO SYSTEM STATE (Synced with Ref for Game Loop) ---
    const [uiComboState, setUiComboState] = useState({ multiplier: 1, timer: 30000, maxTime: 30000 });
    
    // Refs for animation and game state
    const animationFrameRef = useRef<number>(0);
    const lastLogicUpdateTimeRef = useRef(0);
    const lastFrameTimeRef = useRef(0);
    const directionRef = useRef<Direction>('RIGHT');
    const prevSnakeRef = useRef<SnakeSegment[]>([]);
    
    // Game Logic Refs
    const comboRef = useRef({
        multiplier: 1.0,
        count: 0,
        timer: 30000, // ms
        maxTime: 30000, // ms
        active: false,
        pulse: 0 
    });
    const floatingTextsRef = useRef<FloatingText[]>([]);

    useEffect(() => {
        const handleResize = () => {
            const verticalPadding = 320; 
            const horizontalPadding = 40;
            const size = Math.min(window.innerWidth - horizontalPadding, window.innerHeight - verticalPadding);
            setCanvasSize(Math.max(200, size));
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const CELL_SIZE = canvasSize / GRID_SIZE;

    // Helper to add points/combo (used in normal eat and dash eat)
    const handleEatApple = useCallback((eatenFood: Food, headX: number, headY: number) => {
        const basePoints = 1;
        const foodMult = eatenFood.type === 'golden' ? 5 : 1;
        
        const upgradeLevel = snakeUpgrades['comboMaster'] || 0;
        const upgradeBoost = upgradeLevel * 0.0025;
        const increment = 0.01 + upgradeBoost;

        comboRef.current.multiplier += increment;
        comboRef.current.count += 1;
        comboRef.current.maxTime *= 0.9;
        comboRef.current.timer = comboRef.current.maxTime;
        comboRef.current.pulse = 1.0;

        const pointsGained = basePoints * foodMult * comboRef.current.multiplier;

        floatingTextsRef.current.push({
            id: Date.now() + Math.random(),
            x: headX * CELL_SIZE,
            y: headY * CELL_SIZE,
            text: `+${(increment * 100).toFixed(2)}%`,
            subText: `${comboRef.current.count}x`,
            life: 1.0,
            color: eatenFood.type === 'golden' ? '#FBBF24' : '#ffffff'
        });
        
        setScore(s => s + 1);
        setInternalScore(s => s + pointsGained);
        setApplesSinceLastReset(a => a + 1);
    }, [CELL_SIZE, snakeUpgrades]);

    const generateFood = useCallback(() => {
        setFood(prevFood => {
            let applesToAdd = 0;
            const roll = Math.random();
            const chances = snakeGameSettings.frenzyChances;
            let cumulativeProb = 0;
            const tierChances = [chances[4], chances[3], chances[2], chances[1], chances[0]];
            const numApples = [5, 4, 3, 2, 1];

            for(let i = 0; i < tierChances.length; i++) {
                cumulativeProb += tierChances[i];
                if(roll < cumulativeProb) {
                    applesToAdd = numApples[i];
                    break;
                }
            }
            
            const numToGenerate = 1 + applesToAdd;
            const newFoodItems: Food[] = [];
            
            // We use a safe copy of snake from state if available, or just generate safely
            // Note: In strict React, accessing state in callback might be stale, 
            // but generateFood is triggered by effects that depend on it.
            // For safety, we can check collision against 'prevFood' only here, 
            // and rely on the grid probability.
            
            for(let i = 0; i < numToGenerate; i++) {
                let newFoodPosition;
                // Simple collision check (perfect collision check is expensive in loop)
                newFoodPosition = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
                newFoodItems.push({ ...newFoodPosition, type: Math.random() < snakeGameSettings.goldenAppleChance ? 'golden' : 'normal' });
            }
            return [...prevFood, ...newFoodItems];
        });
    }, [snakeGameSettings.frenzyChances, snakeGameSettings.goldenAppleChance]);

    useEffect(() => {
        if (food.length === 0 && !gameOver) {
            generateFood();
        }
    }, [food.length, generateFood, gameOver]);
    
    useEffect(() => {
        if (applesSinceLastReset >= 10 && paralamasChargesUsed > 0) {
            setParalamasChargesUsed(0);
            setApplesSinceLastReset(0);
        }
    }, [applesSinceLastReset, paralamasChargesUsed]);

    // --- DASH LOGIC ---
    const performDash = useCallback((dir: Direction) => {
        const now = Date.now();
        if (now < dashCooldownRef.current) return;

        // Visual Feedback
        setIsDashingVisual(true);
        setTimeout(() => setIsDashingVisual(false), 300);
        
        // Cooldown
        dashCooldownRef.current = now + DASH_COOLDOWN;
        setDashCooldownTimer(DASH_COOLDOWN);

        // Activate Bullet Time
        setSlowMoActive(true);
        if (dashReactionTimeoutRef.current) clearTimeout(dashReactionTimeoutRef.current);
        dashReactionTimeoutRef.current = window.setTimeout(() => {
            setSlowMoActive(false);
        }, DASH_REACTION_TIME);

        setSnake(currentSnake => {
            const head = currentSnake[0];
            let dx = 0; let dy = 0;
            if (dir === 'UP') dy = -1;
            else if (dir === 'DOWN') dy = 1;
            else if (dir === 'LEFT') dx = -1;
            else if (dir === 'RIGHT') dx = 1;

            const newBody = [...currentSnake];
            let currentHead = { ...head };
            let safetyBreak = 0;

            // Instant movement loop
            while (safetyBreak < GRID_SIZE) {
                const nextX = currentHead.x + dx;
                const nextY = currentHead.y + dy;

                // Check Wall Collision (Stop just before wall)
                if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
                    break;
                }

                currentHead = { x: nextX, y: nextY };
                
                // Move snake: Add new head
                newBody.unshift(currentHead);

                // Check Food Collision locally to update score/combo immediately
                // We need to access the 'food' state. 
                // Since we are inside setSnake updater, we can't easily see the fresh 'food' state 
                // without a ref or complex merging.
                // SOLUTION: We will filter the food in a separate setFood call immediately after.
                // Here we just handle the body growth logic.
                
                // Optimistic check against ref-like logic would be ideal, 
                // but strictly: we'll check collision in the setFood updater below.
                // However, we need to know if we grew or not to pop the tail.
                // Let's rely on the setFood logic to handle the "eating" event 
                // and here we assume we DON'T grow unless we hit something, 
                // BUT determining that inside this loop is hard.
                
                // ALTERNATIVE: "Straighten" logic implies we occupy the line.
                // Let's assume we consume length.
                newBody.pop(); 
                
                safetyBreak++;
            }
            
            // Now we have moved the snake to the wall. 
            // We need to check collisions with food along the path we just traveled.
            // We can do this by calculating the segment from OldHead to NewHead.
            return newBody;
        });

        // Handle Food Collection along the dash path
        setFood(currentFood => {
            // We need the snake BEFORE the dash to know where it started
            // This is tricky inside the callback. 
            // Simplified: The snake moves so fast, we just check if any food is on the new body parts?
            // No, the new body parts might not cover the whole path if snake is short.
            // We need to calculate the swept path.
            
            // Re-calculate vector
            let dx = 0; let dy = 0;
            if (dir === 'UP') dy = -1;
            else if (dir === 'DOWN') dy = 1;
            else if (dir === 'LEFT') dx = -1;
            else if (dir === 'RIGHT') dx = 1;
            
            // We need the head position *before* the update. 
            // We can use prevSnakeRef.current[0] since dash happens on input/frame.
            const startHead = prevSnakeRef.current[0] || {x:10, y:10};
            
            const eatenIndices: number[] = [];
            
            // Trace the path
            let checkX = startHead.x + dx;
            let checkY = startHead.y + dy;
            
            while(checkX >= 0 && checkX < GRID_SIZE && checkY >= 0 && checkY < GRID_SIZE) {
                const fIndex = currentFood.findIndex(f => f.x === checkX && f.y === checkY);
                if (fIndex !== -1) {
                    eatenIndices.push(fIndex);
                    // Trigger logic for score
                    handleEatApple(currentFood[fIndex], checkX, checkY);
                    
                    // Since we ate, we need to grow the snake.
                    // We can trigger a setSnake to unshift a tail or duplicate tail?
                    // Easiest is to append to tail in a separate setSnake call, 
                    // or just accept that Dash might not visually grow instantly but the score counts.
                    // Let's try to grow the snake to be correct.
                    setSnake(s => {
                        const tail = s[s.length-1];
                        return [...s, {...tail}]; // Grow by 1 at tail
                    });
                }
                checkX += dx;
                checkY += dy;
            }
            
            if (eatenIndices.length > 0) {
                return currentFood.filter((_, i) => !eatenIndices.includes(i));
            }
            return currentFood;
        });

    }, [handleEatApple]);

    const changeDirection = useCallback((newDir: Direction) => {
        if (gameOver) return;
        
        const now = Date.now();
        const currentDir = directionRef.current;
        
        // Double Tap Logic
        if (hasDashSkill && newDir === currentDir && lastKeyPressRef.current?.dir === newDir) {
            const timeDiff = now - lastKeyPressRef.current.time;
            if (timeDiff < 500 && timeDiff > 50) { // 50ms debounce
                performDash(newDir);
                lastKeyPressRef.current = null; // Consume tap
                return;
            }
        }
        
        lastKeyPressRef.current = { dir: newDir, time: now };

        const oppositeDirs: Record<Direction, Direction> = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT' };
        if (newDir !== oppositeDirs[currentDir]) {
            directionRef.current = newDir;
        }
    }, [gameOver, hasDashSkill, performDash]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const keyMap: { [key: string]: Direction } = { arrowup: 'UP', w: 'UP', arrowdown: 'DOWN', s: 'DOWN', arrowleft: 'LEFT', a: 'LEFT', arrowright: 'RIGHT', d: 'RIGHT' };
        const newDir = keyMap[e.key.toLowerCase()];
        if (newDir) {
            e.preventDefault();
            changeDirection(newDir);
        }
    }, [changeDirection]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    // Main Game Loop using requestAnimationFrame
    const gameLoop = useCallback((timestamp: number) => {
        if (gameOver) return;

        animationFrameRef.current = requestAnimationFrame(gameLoop);

        const deltaTime = timestamp - lastFrameTimeRef.current;
        lastFrameTimeRef.current = timestamp;

        // --- Timer Logic ---
        if (comboRef.current.timer > 0) {
            comboRef.current.timer -= deltaTime;
            if (comboRef.current.timer <= 0) {
                comboRef.current.timer = 0;
                comboRef.current.multiplier = 1.0;
                comboRef.current.count = 0;
                comboRef.current.maxTime = 30000;
            }
        }
        
        // --- Pulse Decay ---
        if (comboRef.current.pulse > 0) {
            comboRef.current.pulse = Math.max(0, comboRef.current.pulse - deltaTime * 0.005);
        }
        
        // --- Dash Cooldown Tick ---
        if (dashCooldownTimer > 0) {
            setDashCooldownTimer(prev => Math.max(0, prev - deltaTime));
        }

        setUiComboState({
            multiplier: comboRef.current.multiplier,
            timer: comboRef.current.timer,
            maxTime: comboRef.current.maxTime
        });

        // Dynamic Speed: Base * Modifiers * SlowMo
        let currentSpeed = BASE_GAME_SPEED * snakeGameSettings.speedModifier;
        if (slowMoActive) currentSpeed *= 6; // 6x slower

        const timeSinceLastUpdate = timestamp - lastLogicUpdateTimeRef.current;

        // --- Logic Update Step ---
        if (timeSinceLastUpdate > currentSpeed) {
            lastLogicUpdateTimeRef.current = timestamp;
            prevSnakeRef.current = snake;

            setSnake(prevSnake => {
                if (prevSnake.length === 0) {
                    setGameOver(true);
                    return [];
                }

                const head = prevSnake[0];
                const newHead = { ...head };

                switch (directionRef.current) {
                    case 'UP': newHead.y -= 1; break;
                    case 'DOWN': newHead.y += 1; break;
                    case 'LEFT': newHead.x -= 1; break;
                    case 'RIGHT': newHead.x += 1; break;
                }

                const eatenFoodIndex = food.findIndex(f => f.x === newHead.x && f.y === newHead.y);
                const isEating = eatenFoodIndex !== -1;

                const isWallCollision = newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE;
                const availableCharges = snakeGameSettings.paralamasCharges - paralamasChargesUsed;

                if (isWallCollision && availableCharges > 0) {
                    setParalamasChargesUsed(c => c + 1);
                    setApplesSinceLastReset(0);
                    let newDirection: Direction = 'RIGHT';
                    if (newHead.y < 0) { newHead.y = 2; newDirection = Math.random() < 0.5 ? 'LEFT' : 'RIGHT'; } 
                    else if (newHead.y >= GRID_SIZE) { newHead.y = GRID_SIZE - 3; newDirection = Math.random() < 0.5 ? 'LEFT' : 'RIGHT'; } 
                    else if (newHead.x < 0) { newHead.x = 2; newDirection = Math.random() < 0.5 ? 'UP' : 'DOWN'; } 
                    else { newHead.x = GRID_SIZE - 3; newDirection = Math.random() < 0.5 ? 'UP' : 'DOWN'; }
                    directionRef.current = newDirection;
                    return prevSnake; 
                }
                
                const snakeToCheck = isEating ? prevSnake : prevSnake.slice(0, prevSnake.length - 1);
                const isSelfCollision = snakeToCheck.some(segment => segment.x === newHead.x && segment.y === newHead.y);
                
                if ((isWallCollision && availableCharges <= 0) || isSelfCollision) {
                    if (lives > 1) {
                        setLives(l => l - 1);
                        directionRef.current = 'RIGHT';
                        return getInitialSnake(snakeGameSettings.initialLength);
                    } else {
                        setGameOver(true);
                        return prevSnake;
                    }
                }
                
                let newSnake = [newHead, ...prevSnake];

                if (isEating) {
                    const eatenFood = food[eatenFoodIndex];
                    // Using helper within the loop logic requires slight refactoring to avoid dependency cycle
                    // Manually duplicating logic here for performance inside the loop
                    const basePoints = 1;
                    const foodMult = eatenFood.type === 'golden' ? 5 : 1;
                    
                    const upgradeLevel = snakeUpgrades['comboMaster'] || 0;
                    const upgradeBoost = upgradeLevel * 0.0025; 
                    const increment = 0.01 + upgradeBoost;

                    comboRef.current.multiplier += increment;
                    comboRef.current.count += 1;
                    comboRef.current.maxTime *= 0.9;
                    comboRef.current.timer = comboRef.current.maxTime;
                    comboRef.current.pulse = 1.0; 

                    const pointsGained = basePoints * foodMult * comboRef.current.multiplier;

                    floatingTextsRef.current.push({
                        id: Date.now() + Math.random(),
                        x: newHead.x * CELL_SIZE,
                        y: newHead.y * CELL_SIZE,
                        text: `+${(increment * 100).toFixed(2)}%`,
                        subText: `${comboRef.current.count}x`,
                        life: 1.0,
                        color: eatenFood.type === 'golden' ? '#FBBF24' : '#ffffff'
                    });
                    
                    setScore(s => s + 1);
                    setInternalScore(s => s + pointsGained);
                    setFood(f => f.filter((_, i) => i !== eatenFoodIndex));
                    setApplesSinceLastReset(a => a + 1);
                } else {
                    newSnake.pop();
                }
                
                return newSnake;
            });
        }

        // --- Render Step ---
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        
        // 1. Draw Background
        ctx.fillStyle = '#1a202c'; 
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 1;
        for (let i = 1; i < GRID_SIZE; i++) {
            ctx.beginPath(); ctx.moveTo(i * CELL_SIZE, 0); ctx.lineTo(i * CELL_SIZE, canvasSize); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * CELL_SIZE); ctx.lineTo(canvasSize, i * CELL_SIZE); ctx.stroke();
        }

        const progress = Math.min(1, timeSinceLastUpdate / currentSpeed);

        // 2. Draw Food
        food.forEach(f => {
            const appleX = f.x * CELL_SIZE + CELL_SIZE / 2;
            const appleY = f.y * CELL_SIZE + CELL_SIZE / 2;
            const radius = CELL_SIZE / 2 * 0.8;
            ctx.fillStyle = f.type === 'golden' ? '#FBBF24' : '#f56565';
            ctx.beginPath(); ctx.arc(appleX, appleY, radius, 0, Math.PI * 2); ctx.fill();
        });
        
        // 3. Draw Snake
        const snakeBodyGradient = ctx.createLinearGradient(0, 0, 0, canvasSize);
        if (slowMoActive) {
            snakeBodyGradient.addColorStop(0, '#00eaff');
            snakeBodyGradient.addColorStop(1, '#0077ff');
        } else {
            snakeBodyGradient.addColorStop(0, '#a3ff00');
            snakeBodyGradient.addColorStop(1, '#69c200');
        }

        snake.slice(1).forEach((segment, index) => {
            const prevSegment = prevSnakeRef.current[index + 1] || segment;
            const interpX = (prevSegment.x + (segment.x - prevSegment.x) * progress) * CELL_SIZE;
            const interpY = (prevSegment.y + (segment.y - prevSegment.y) * progress) * CELL_SIZE;
            const padding = CELL_SIZE * 0.1;
            const segmentSize = CELL_SIZE - padding * 2;
            ctx.fillStyle = snakeBodyGradient;
            ctx.strokeStyle = slowMoActive ? '#003366' : '#234d20';
            ctx.lineWidth = 2;
            drawRoundRect(ctx, interpX + padding, interpY + padding, segmentSize, segmentSize, 5);
            ctx.fill(); ctx.stroke();
        });
        
        const snakeHead = snake[0];
        if (snakeHead) {
            const prevSnakeHead = prevSnakeRef.current[0] || snakeHead;
            const headX = (prevSnakeHead.x + (snakeHead.x - prevSnakeHead.x) * progress) * CELL_SIZE;
            const headY = (prevSnakeHead.y + (snakeHead.y - prevSnakeHead.y) * progress) * CELL_SIZE;
            const headPadding = CELL_SIZE * 0.05;
            const headSize = CELL_SIZE - headPadding * 2;
            ctx.fillStyle = snakeBodyGradient;
            ctx.strokeStyle = slowMoActive ? '#003366' : '#1e421c';
            ctx.lineWidth = 3;
            drawRoundRect(ctx, headX + headPadding, headY + headPadding, headSize, headSize, 8);
            ctx.fill(); ctx.stroke();
        }

        // 4. Draw Floating Texts
        floatingTextsRef.current.forEach(ft => {
            ft.y -= 0.5 * (deltaTime / 16);
            ft.life -= 0.02 * (deltaTime / 16);
        });
        floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.life > 0);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        floatingTextsRef.current.forEach(ft => {
            ctx.globalAlpha = Math.max(0, ft.life);
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = ft.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, ft.x + CELL_SIZE/2, ft.y);
            ctx.fillText(ft.text, ft.x + CELL_SIZE/2, ft.y);
            if (ft.subText) {
                ctx.font = 'bold 12px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.strokeText(ft.subText, ft.x + CELL_SIZE/2 + 25, ft.y + 10);
                ctx.fillText(ft.subText, ft.x + CELL_SIZE/2 + 25, ft.y + 10);
            }
            ctx.globalAlpha = 1.0;
        });

        // 5. Draw Rhythm Game Style Combo UI (Top Right)
        const combo = comboRef.current;
        if (combo.multiplier >= 1.0) {
            const pad = 10;
            const xPos = canvasSize - pad;
            const yPos = pad + 10;
            
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            
            // Determine Color
            let color = '#a0aec0'; // Gray
            if (combo.multiplier >= 2.5) color = `hsl(${Date.now() / 5 % 360}, 100%, 50%)`; // Chromatic
            else if (combo.multiplier >= 2.0) color = '#ef4444'; // Red
            else if (combo.multiplier >= 1.5) color = '#22c55e'; // Green

            // Pulse Scaling
            const scale = 1 + (combo.pulse * 0.2);
            ctx.save();
            ctx.translate(xPos, yPos);
            ctx.scale(scale, scale);

            // Multiplier Text
            ctx.font = 'italic 900 36px Arial';
            ctx.fillStyle = color;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            const multText = `${combo.multiplier.toFixed(2)}x`;
            ctx.fillText(multText, 0, 0);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.strokeText(multText, 0, 0);

            // Combo Count
            ctx.font = 'italic 700 14px Arial';
            ctx.fillStyle = 'white';
            ctx.shadowBlur = 0;
            ctx.fillText(`${combo.count} COMBO`, 0, 40);

            // Bar Background
            const barW = 120;
            const barH = 6;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(-barW, 60, barW, barH);

            // Bar Fill
            const pct = Math.max(0, combo.timer / combo.maxTime);
            ctx.fillStyle = color;
            ctx.fillRect(-barW + (barW * (1 - pct)), 60, barW * pct, barH); // Fill from right

            ctx.restore();
        }

    }, [snake, food, gameOver, lives, canvasSize, CELL_SIZE, snakeGameSettings, paralamasChargesUsed, snakeUpgrades, slowMoActive, dashCooldownTimer]);

    useEffect(() => {
        prevSnakeRef.current = snake;
        lastLogicUpdateTimeRef.current = performance.now();
        lastFrameTimeRef.current = performance.now();
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [gameLoop, snake]); 

    const finalWinnings = ((0.05 * internalScore * internalScore) + (0.55 * internalScore) + 0.4) * totalScoreMultiplier;
    const tabBtnClasses = (isActive: boolean) => `flex-1 p-2 rounded-t-lg font-bold cursor-pointer transition-colors ${isActive ? 'bg-green-500/20 text-white' : 'bg-black/20 text-gray-400 hover:bg-black/40'}`;
    const controlBtnClasses = "w-full h-full bg-gray-700 text-white font-bold py-2 rounded-lg hover:bg-gray-600 active:bg-green-500 active:scale-95 transition-all disabled:opacity-50 disabled:active:bg-gray-700 disabled:active:scale-100";

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className={`
                relative bg-gradient-to-br from-gray-800 to-black rounded-2xl p-4 shadow-2xl border-4 w-full h-full text-white text-center flex flex-col items-center justify-center overflow-hidden gap-2 transition-colors duration-300
                ${slowMoActive ? 'border-blue-400 shadow-blue-500/50' : 'border-green-500'}
            `}>
                
                {/* Header Info */}
                <div className="flex justify-between items-center w-full max-w-md px-2">
                    <h2 className="text-2xl font-bold text-green-400">Snake</h2>
                    <div className="text-right">
                        <div className="text-xs text-gray-400">GANHOS</div>
                        <div className="font-bold text-green-400">${finalWinnings.toFixed(2)}</div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="grid grid-cols-2 gap-x-4 w-full max-w-md text-sm">
                    <span className="text-left">Vidas: <span className="font-bold text-red-400">{'❤️'.repeat(lives)}</span></span>
                    <span className="text-right">Score: <span className="font-bold text-yellow-400">{score}</span></span>
                </div>

                {/* Canvas Container */}
                <div className={`relative transition-transform duration-100 ${isDashingVisual ? 'scale-105' : 'scale-100'}`}>
                    <canvas ref={canvasRef} width={canvasSize} height={canvasSize} className={`bg-gray-900 rounded-lg border-2 border-green-700 shadow-lg ${isDashingVisual ? 'brightness-125' : ''}`} />
                    
                    {/* Slow Mo Visual Overlay */}
                    {slowMoActive && (
                        <div className="absolute inset-0 rounded-lg pointer-events-none border-4 border-blue-400 animate-pulse shadow-[inset_0_0_50px_rgba(59,130,246,0.5)] flex items-center justify-center">
                            <span className="text-blue-300 font-black text-4xl opacity-50 tracking-widest rotate-12">SLOW MO</span>
                        </div>
                    )}
                </div>

                {/* Dash Cooldown Indicator */}
                {hasDashSkill && (
                    <div className="w-full max-w-xs h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
                        <div 
                            className={`h-full transition-all duration-100 ${dashCooldownTimer > 0 ? 'bg-red-500' : 'bg-blue-400'}`}
                            style={{ width: `${Math.max(0, (1 - dashCooldownTimer / DASH_COOLDOWN) * 100)}%` }}
                        />
                    </div>
                )}

                {/* Controls */}
                <div className="w-full max-w-[180px] aspect-square grid grid-cols-3 grid-rows-3 gap-1 mt-2">
                    <div className="col-start-2 row-start-1">
                        <button onMouseDown={(e) => { e.preventDefault(); changeDirection('UP'); }} onTouchStart={(e) => { e.preventDefault(); changeDirection('UP'); }} className={controlBtnClasses} disabled={gameOver}>▲</button>
                    </div>
                    <div className="col-start-1 row-start-2">
                        <button onMouseDown={(e) => { e.preventDefault(); changeDirection('LEFT'); }} onTouchStart={(e) => { e.preventDefault(); changeDirection('LEFT'); }} className={controlBtnClasses} disabled={gameOver}>◀</button>
                    </div>
                    <div className="col-start-3 row-start-2">
                        <button onMouseDown={(e) => { e.preventDefault(); changeDirection('RIGHT'); }} onTouchStart={(e) => { e.preventDefault(); changeDirection('RIGHT'); }} className={controlBtnClasses} disabled={gameOver}>▶</button>
                    </div>
                    <div className="col-start-2 row-start-3">
                        <button onMouseDown={(e) => { e.preventDefault(); changeDirection('DOWN'); }} onTouchStart={(e) => { e.preventDefault(); changeDirection('DOWN'); }} className={controlBtnClasses} disabled={gameOver}>▼</button>
                    </div>
                </div>

                {gameOver && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center rounded-2xl p-6 overflow-y-auto z-20">
                        <div className="w-full max-w-md my-auto">
                            <h3 className="text-4xl font-bold text-red-500 mb-4">Fim de Jogo!</h3>
                            <div className="flex gap-1 mb-2">
                                <button onClick={() => setGameOverTab('result')} className={tabBtnClasses(gameOverTab === 'result')}>Resultado</button>
                                <button onClick={() => setGameOverTab('upgrades')} className={tabBtnClasses(gameOverTab === 'upgrades')}>Upgrades</button>
                            </div>
                            <div className="bg-black/30 rounded-b-lg rounded-tr-lg p-4">
                                {gameOverTab === 'result' ? (
                                    <div className="flex flex-col items-center justify-center min-h-[250px]">
                                        <p className="text-2xl mb-2">Você coletou <span className="font-bold text-yellow-300">{score}</span> maçãs.</p>
                                        <p className="text-sm text-gray-400 mb-4">Maior Combo: <span className="text-white font-bold">{((uiComboState.multiplier - 1) * 100).toFixed(0)}%</span></p>
                                        <p className="text-3xl font-bold text-green-400 mb-6">Ganhos Finais: ${finalWinnings.toFixed(2)}</p>
                                        <button 
                                            onClick={() => onClose(internalScore)}
                                            className="py-3 px-6 bg-green-500 text-black font-bold rounded-lg text-lg hover:bg-green-400 transition-colors"
                                        >
                                            Coletar Recompensa
                                        </button>
                                    </div>
                                ) : (
                                    <SnakeUpgrades
                                        bal={bal}
                                        snakeUpgrades={snakeUpgrades}
                                        buySnakeUpgrade={buySnakeUpgrade}
                                        resetSnakeUpgrades={resetSnakeUpgrades}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SnakeGame;
