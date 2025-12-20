
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SnakeUpgradeId } from '../../../types';
import SnakeUpgrades from './SnakeUpgrades';
import { SNAKE_UPGRADES } from '../../../constants/snakeUpgrades';

const GRID_SIZE = 20;
const BASE_GAME_SPEED = 150; // ms
const DASH_COOLDOWN = 2500; // Reduzido para 2.5s para incentivar o uso constante
const DASH_REACTION_TIME = 1000; // 1 segundo de tempo de reação (slow motion)
const DASH_DOUBLE_TAP_WINDOW = 400; // Janela para duplo toque
const WALL_COLLISION_GRACE_TIME = 150; // Tempo de graça antes de morrer na parede

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
    const [dashPath, setDashPath] = useState<SnakeSegment[]>([]); // Para visualização
    
    // --- SKILL UPGRADES STATE ---
    const [pushedAppleIndex, setPushedAppleIndex] = useState<number | null>(null);

    const lastKeyPressRef = useRef<{ dir: Direction, time: number } | null>(null);
    const dashCooldownRef = useRef(0);
    const dashReactionTimeoutRef = useRef<number | null>(null);
    const isDashingRef = useRef(false); // Previne chamadas múltiplas
    const wallCollisionGraceRef = useRef<number | null>(null); // Timestamp do inicio da colisão

    const hasDashSkill = (snakeUpgrades['dashSkill'] || 0) > 0;
    const subtleAlertLevel = snakeUpgrades['subtleAlert'] || 0;
    const alarmingAlertLevel = snakeUpgrades['alarmingAlert'] || 0;
    const pushAppleLevel = snakeUpgrades['pushApple'] || 0;

    // --- COMBO SYSTEM STATE (Synced with Ref for Game Loop) ---
    // Added 'pulse', 'shake', 'isActive', 'count' to state to drive React animations
    const [uiComboState, setUiComboState] = useState({ 
        multiplier: 1, 
        count: 0,
        timer: 0, 
        maxTime: 30000, 
        pulse: 0, 
        shake: 0, 
        isActive: false 
    });
    
    // Refs for animation and game state
    const animationFrameRef = useRef<number>(0);
    const lastLogicUpdateTimeRef = useRef(0);
    const lastFrameTimeRef = useRef(0);
    
    // Direction Refs
    const directionRef = useRef<Direction>('RIGHT'); // Intended direction
    const lastMoveDirRef = useRef<Direction>('RIGHT'); // Actually executed direction (Physics)
    
    const prevSnakeRef = useRef<SnakeSegment[]>([]);
    
    // Game Logic Refs
    const comboRef = useRef({
        multiplier: 1.0,      // Multiplicador atual (1.0 = sem combo)
        count: 0,             // Quantas maçãs no combo atual
        timer: 0,             // Tempo restante (ms)
        maxTime: 30000,       // Tempo máximo atual (ms)
        isActive: false,      // Combo está ativo? (visual)
        pulse: 0              // Animação de pulso (0-1)
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
        
        // --- 1. UPGRADE BONUS ---
        const upgradeLevel = snakeUpgrades['comboMaster'] || 0;
        const upgradeBoost = upgradeLevel * 0.0025;
        const increment = 0.01 + upgradeBoost;

        // --- 2. INCREMENTAR MULTIPLIER ---
        const isFirstApple = comboRef.current.count === 0;
        
        if (isFirstApple) {
            // Primeira maçã: Iniciar combo
            comboRef.current.multiplier = 1.0 + increment;
            comboRef.current.count = 1;
            comboRef.current.maxTime = 30000;
            comboRef.current.timer = 30000;
            comboRef.current.isActive = true;
        } else {
            // Maçãs subsequentes: Incrementar e reduzir timer
            comboRef.current.multiplier += increment;
            comboRef.current.count += 1;
            
            // --- 3. CURVA PROGRESSIVA DO TIMER ---
            const currentMax = comboRef.current.maxTime;
            let newMax = currentMax;

            if (currentMax > 4000) {
                // Fase inicial (30s → 4s): Redução agressiva de 10%
                newMax = currentMax * 0.90;
            } else if (currentMax > 2000) {
                // Fase intermediária (4s → 2s): Redução moderada de 5%
                newMax = currentMax * 0.95;
            } else {
                // Fase crítica (< 2s): Redução mínima de 50ms
                // Piso absoluto em 1.2s para permitir combo longo
                newMax = Math.max(1200, currentMax - 50);
            }
            
            comboRef.current.maxTime = newMax;
            comboRef.current.timer = newMax;
        }
        
        comboRef.current.pulse = 1.0;

        // --- 4. CALCULAR SCORE ---
        // Garante que multiplier sempre >= 1.0 (nunca nerfa)
        const effectiveMultiplier = Math.max(1.0, comboRef.current.multiplier);
        const pointsGained = basePoints * foodMult * effectiveMultiplier;

        // --- 5. FLOATING TEXT ---
        floatingTextsRef.current.push({
            id: Date.now() + Math.random(),
            x: headX * CELL_SIZE,
            y: headY * CELL_SIZE,
            text: `+${(increment * 100).toFixed(2)}%`,
            subText: `${comboRef.current.count}x | ${(comboRef.current.maxTime / 1000).toFixed(1)}s`,
            life: 1.0,
            color: eatenFood.type === 'golden' ? '#FBBF24' : '#ffffff'
        });
        
        // --- 6. ATUALIZAR ESTADOS ---
        setScore(s => s + 1);
        setInternalScore(s => s + pointsGained);
        setApplesSinceLastReset(a => a + 1);
        
        // Trigger UI update com shake
        setUiComboState(prev => ({ 
            ...prev, 
            multiplier: comboRef.current.multiplier,
            count: comboRef.current.count,
            timer: comboRef.current.timer,
            maxTime: comboRef.current.maxTime,
            isActive: comboRef.current.isActive,
            shake: Math.random()
        }));
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
            
            for(let i = 0; i < numToGenerate; i++) {
                let newFoodPosition;
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
    
    // Balanced Paralamas Recharge
    const paralamasLevel = snakeGameSettings.paralamasCharges;
    const rechargeThreshold = paralamasLevel >= 3 ? 15 : paralamasLevel === 2 ? 12 : 10;

    useEffect(() => {
        if (applesSinceLastReset >= rechargeThreshold && paralamasChargesUsed > 0) {
            setParalamasChargesUsed(0);
            setApplesSinceLastReset(0);
        }
    }, [applesSinceLastReset, paralamasChargesUsed, rechargeThreshold]);

    // --- UI COOLDOWN TIMER (Independent Loop) ---
    // Fix: This loop runs separately from physics to avoid re-rendering the whole game component 60fps
    useEffect(() => {
        if (dashCooldownTimer <= 0) return;
        const interval = setInterval(() => {
            setDashCooldownTimer(prev => Math.max(0, prev - 100));
        }, 100);
        return () => clearInterval(interval);
    }, [dashCooldownTimer]);

    // --- DASH LOGIC ---
    const performDash = useCallback((dir: Direction) => {
        const now = Date.now();
        
        // Verificações de segurança
        if (now < dashCooldownRef.current) return;
        if (isDashingRef.current) return; // Previne execução dupla
        if (gameOver) return;
        
        isDashingRef.current = true;

        // 1. FEEDBACK VISUAL IMEDIATO
        setIsDashingVisual(true);
        setTimeout(() => setIsDashingVisual(false), 300);
        
        // 2. ATIVAR COOLDOWN
        dashCooldownRef.current = now + DASH_COOLDOWN;
        setDashCooldownTimer(DASH_COOLDOWN); // Trigger UI loop

        // 3. ATIVAR SLOW MOTION (Para reação pós-dash)
        setSlowMoActive(true);
        if (dashReactionTimeoutRef.current) clearTimeout(dashReactionTimeoutRef.current);
        dashReactionTimeoutRef.current = window.setTimeout(() => {
            setSlowMoActive(false);
        }, DASH_REACTION_TIME);

        // 4. CALCULAR DIREÇÃO
        let dx = 0, dy = 0;
        switch(dir) {
            case 'UP': dy = -1; break;
            case 'DOWN': dy = 1; break;
            case 'LEFT': dx = -1; break;
            case 'RIGHT': dx = 1; break;
        }

        // Update Physics Ref to prevent reversing immediately after dash
        lastMoveDirRef.current = dir;

        // 5. PROCESSAR TRAJETÓRIA E COMIDA
        setSnake(currentSnake => {
            const head = currentSnake[0];
            const pathTraveled: SnakeSegment[] = [];
            let currentPos = { x: head.x, y: head.y };
            
            // Simular o trajeto até a parede
            while (true) {
                const nextX = currentPos.x + dx;
                const nextY = currentPos.y + dy;
                
                // Parar antes de bater na parede (Dash segura)
                if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
                    break;
                }
                
                currentPos = { x: nextX, y: nextY };
                pathTraveled.push({ ...currentPos });
            }
            
            // Se não moveu nada (já estava na parede), retorna
            if (pathTraveled.length === 0) {
                isDashingRef.current = false;
                return currentSnake;
            }

            // Identificar maçãs no caminho (usando o estado atual de 'food')
            const eatenIndices: number[] = [];
            pathTraveled.forEach(pos => {
                food.forEach((f, idx) => {
                    if (f.x === pos.x && f.y === pos.y) {
                        eatenIndices.push(idx);
                        handleEatApple(f, pos.x, pos.y); 
                    }
                });
            });

            // Atualizar visual da comida
            if (eatenIndices.length > 0) {
                setFood(prevFood => prevFood.filter((_, i) => !eatenIndices.includes(i)));
            }

            // CONSTRUIR NOVA COBRA
            const newHeadAndNeck = [...pathTraveled].reverse();
            const fullNewBody = [...newHeadAndNeck, ...currentSnake];
            
            // Calcular novo comprimento
            const newLength = currentSnake.length + eatenIndices.length;
            const finalSnake = fullNewBody.slice(0, newLength);
            
            setDashPath(pathTraveled); // Rastro visual
            return finalSnake;
        });
        
        // Limpar flag e rastro após breve delay
        setTimeout(() => {
            isDashingRef.current = false;
            setDashPath([]);
        }, 100);
        
    }, [snake, food, gameOver, handleEatApple]);

    const changeDirection = useCallback((newDir: Direction) => {
        if (gameOver) return;
        
        const now = Date.now();
        const oppositeDirs: Record<Direction, Direction> = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT' };
        
        // --- VALIDATION AGAINST LAST *PHYSICAL* MOVE ---
        // Previne colisão contra o próprio pescoço em inputs rápidos
        // Se a cobra moveu-se para a DIREITA no último frame, e o jogador aperta ESQUERDA, ignoramos.
        // Mesmo que o jogador tenha apertado CIMA 1ms antes, se o frame ainda não atualizou, o lastMove ainda é DIREITA.
        if (newDir === oppositeDirs[lastMoveDirRef.current]) {
            return;
        }

        // Verificar duplo toque para DASH
        if (hasDashSkill) {
            if (lastKeyPressRef.current?.dir === newDir) {
                const timeDiff = now - lastKeyPressRef.current.time;
                // Janela de duplo toque: entre 50ms e 400ms
                if (timeDiff >= 50 && timeDiff <= DASH_DOUBLE_TAP_WINDOW) {
                    performDash(newDir);
                    lastKeyPressRef.current = null; // Consumir o toque
                    return;
                }
            }
        }
        
        // Atualizar último toque
        lastKeyPressRef.current = { dir: newDir, time: now };

        // Atualizar direção intencional (se não for oposta à atual intencional - check extra leve)
        if (newDir !== oppositeDirs[directionRef.current]) {
            directionRef.current = newDir;

            // --- TRIGGER DE RESPOSTA IMEDIATA ---
            let shouldUpdateImmediately = false;

            // 1. Slow Motion Skip
            if (slowMoActive) {
                setSlowMoActive(false);
                if (dashReactionTimeoutRef.current) clearTimeout(dashReactionTimeoutRef.current);
                shouldUpdateImmediately = true;
            }

            // 2. Wall Grace Period Rescue
            if (wallCollisionGraceRef.current) {
                shouldUpdateImmediately = true;
            }

            if (shouldUpdateImmediately) {
                lastLogicUpdateTimeRef.current = 0; // Força update no próximo frame
            }
        }
    }, [gameOver, hasDashSkill, performDash, slowMoActive]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        const keyMap: { [key: string]: Direction } = { arrowup: 'UP', w: 'UP', arrowdown: 'DOWN', s: 'DOWN', arrowleft: 'LEFT', a: 'LEFT', arrowright: 'RIGHT', d: 'RIGHT' };
        const newDir = keyMap[key];
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

        // --- COMBO TIMER LOGIC ---
        if (comboRef.current.isActive && comboRef.current.timer > 0) {
            comboRef.current.timer -= deltaTime;
            if (comboRef.current.timer <= 0) {
                comboRef.current.timer = 0;
                comboRef.current.multiplier = 1.0;
                comboRef.current.count = 0;
                comboRef.current.maxTime = 30000;
                comboRef.current.isActive = false;
                comboRef.current.pulse = 0;
            }
        }

        if (comboRef.current.pulse > 0) {
            comboRef.current.pulse = Math.max(0, comboRef.current.pulse - deltaTime * 0.005);
        }

        setUiComboState(prev => ({
            ...prev,
            multiplier: comboRef.current.multiplier,
            count: comboRef.current.count,
            timer: comboRef.current.timer,
            maxTime: comboRef.current.maxTime,
            pulse: comboRef.current.pulse,
            isActive: comboRef.current.isActive
        }));

        let currentSpeed = BASE_GAME_SPEED * snakeGameSettings.speedModifier;
        if (slowMoActive) currentSpeed *= 6; 

        const timeSinceLastUpdate = timestamp - lastLogicUpdateTimeRef.current;

        // --- Logic Update Step ---
        if (timeSinceLastUpdate > currentSpeed) {
            lastLogicUpdateTimeRef.current = timestamp;
            prevSnakeRef.current = snake;
            
            // CRITICAL FIX: Sync physics direction with intended direction at the moment of move
            lastMoveDirRef.current = directionRef.current;

            setSnake(prevSnake => {
                if (prevSnake.length === 0) {
                    setGameOver(true);
                    return [];
                }

                const head = prevSnake[0];
                const newHead = { ...head };

                let dx = 0, dy = 0;
                // Use directionRef.current (Intended) which is now synced to lastMoveDirRef
                switch (directionRef.current) {
                    case 'UP': dy = -1; break;
                    case 'DOWN': dy = 1; break;
                    case 'LEFT': dx = -1; break;
                    case 'RIGHT': dx = 1; break;
                }
                newHead.x += dx;
                newHead.y += dy;

                const isWallCollision = newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE;
                const availableCharges = snakeGameSettings.paralamasCharges - paralamasChargesUsed;

                if (isWallCollision) {
                    const now = performance.now();
                    
                    if (!wallCollisionGraceRef.current) {
                        wallCollisionGraceRef.current = now;
                        return prevSnake; 
                    } else {
                        if (now - wallCollisionGraceRef.current < WALL_COLLISION_GRACE_TIME) {
                            return prevSnake; 
                        }
                    }

                    if (availableCharges > 0) {
                        setParalamasChargesUsed(c => c + 1);
                        setApplesSinceLastReset(0);
                        wallCollisionGraceRef.current = null;
                        
                        let newDirection: Direction = 'RIGHT';
                        if (newHead.y < 0) { newHead.y = 2; newDirection = Math.random() < 0.5 ? 'LEFT' : 'RIGHT'; } 
                        else if (newHead.y >= GRID_SIZE) { newHead.y = GRID_SIZE - 3; newDirection = Math.random() < 0.5 ? 'LEFT' : 'RIGHT'; } 
                        else if (newHead.x < 0) { newHead.x = 2; newDirection = Math.random() < 0.5 ? 'UP' : 'DOWN'; } 
                        else { newHead.x = GRID_SIZE - 3; newDirection = Math.random() < 0.5 ? 'UP' : 'DOWN'; }
                        
                        directionRef.current = newDirection;
                        lastMoveDirRef.current = newDirection; // Sync on teleport
                        return prevSnake; 
                    }
                } else {
                    wallCollisionGraceRef.current = null;
                }
                
                const eatenFoodIndex = food.findIndex(f => f.x === newHead.x && f.y === newHead.y);
                const snakeToCheck = (eatenFoodIndex !== -1) ? prevSnake : prevSnake.slice(0, prevSnake.length - 1);
                const isSelfCollision = snakeToCheck.some(segment => segment.x === newHead.x && segment.y === newHead.y);
                
                if ((isWallCollision && availableCharges <= 0) || isSelfCollision) {
                    if (lives > 1) {
                        setLives(l => l - 1);
                        directionRef.current = 'RIGHT';
                        lastMoveDirRef.current = 'RIGHT';
                        wallCollisionGraceRef.current = null;
                        return getInitialSnake(snakeGameSettings.initialLength);
                    } else {
                        setGameOver(true);
                        return prevSnake;
                    }
                }
                
                let newSnake = [newHead, ...prevSnake];

                if (eatenFoodIndex !== -1) {
                    const eatenFood = food[eatenFoodIndex];
                    handleEatApple(eatenFood, newHead.x, newHead.y);
                    setFood(f => f.filter((_, i) => i !== eatenFoodIndex));
                } else {
                    newSnake.pop();
                }

                if (pushAppleLevel > 0) {
                    const foodUnderBody = food.filter((f, idx) => {
                        if (idx === eatenFoodIndex) return false;
                        return newSnake.some((s, i) => i > 0 && s.x === f.x && s.y === f.y);
                    });

                    if (foodUnderBody.length > 0) {
                        setFood(currentFood => {
                            return currentFood.map(f => {
                                const isUnder = newSnake.some((s, i) => i > 0 && s.x === f.x && s.y === f.y);
                                if (!isUnder) return f;
                                const neighbors = [
                                    {x: f.x, y: f.y - 1}, {x: f.x, y: f.y + 1}, {x: f.x - 1, y: f.y}, {x: f.x + 1, y: f.y}
                                ];
                                neighbors.sort(() => Math.random() - 0.5);
                                const validSpot = neighbors.find(n => 
                                    n.x >= 0 && n.x < GRID_SIZE && n.y >= 0 && n.y < GRID_SIZE &&
                                    !newSnake.some(s => s.x === n.x && s.y === n.y) &&
                                    !currentFood.some(cf => cf.x === n.x && cf.y === n.y)
                                );
                                if (validSpot) {
                                    setPushedAppleIndex(food.indexOf(f));
                                    setTimeout(() => setPushedAppleIndex(null), 150);
                                    return { ...f, x: validSpot.x, y: validSpot.y };
                                }
                                return f;
                            });
                        });
                    }
                }
                
                return newSnake;
            });
        }

        // --- Render Step ---
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = '#1a202c'; 
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 1;
        for (let i = 1; i < GRID_SIZE; i++) {
            ctx.beginPath(); ctx.moveTo(i * CELL_SIZE, 0); ctx.lineTo(i * CELL_SIZE, canvasSize); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * CELL_SIZE); ctx.lineTo(canvasSize, i * CELL_SIZE); ctx.stroke();
        }

        const progress = Math.min(1, timeSinceLastUpdate / currentSpeed);

        food.forEach((f, idx) => {
            const appleX = f.x * CELL_SIZE + CELL_SIZE / 2;
            const appleY = f.y * CELL_SIZE + CELL_SIZE / 2;
            const radius = CELL_SIZE / 2 * 0.8;
            ctx.fillStyle = f.type === 'golden' ? '#FBBF24' : '#f56565';
            ctx.beginPath(); ctx.arc(appleX, appleY, radius, 0, Math.PI * 2); ctx.fill();
            
            if (idx === pushedAppleIndex) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.arc(appleX, appleY, radius + 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
        
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

        if (dashPath.length > 0) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#00eaff';
            dashPath.forEach(segment => {
                const px = segment.x * CELL_SIZE + CELL_SIZE * 0.2;
                const py = segment.y * CELL_SIZE + CELL_SIZE * 0.2;
                const size = CELL_SIZE * 0.6;
                ctx.fillRect(px, py, size, size);
            });
            ctx.globalAlpha = 1.0;
        }

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

    }, [snake, food, gameOver, lives, canvasSize, CELL_SIZE, snakeGameSettings, paralamasChargesUsed, snakeUpgrades, slowMoActive, rechargeThreshold, pushedAppleIndex, pushAppleLevel, dashPath, handleEatApple]);

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

    // --- RENDER OVERLAYS (ALERTS) ---
    
    const getClosestAppleInfo = () => {
        if (!food.length || !snake.length) return null;
        const head = snake[0];
        let closest = food[0];
        let minDist = Infinity;
        
        food.forEach(f => {
            const d = Math.abs(f.x - head.x) + Math.abs(f.y - head.y);
            if (d < minDist) {
                minDist = d;
                closest = f;
            }
        });
        
        const dx = closest.x - head.x;
        const dy = closest.y - head.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI); 
        
        return { closest, minDist, angle };
    };

    const appleInfo = getClosestAppleInfo();

    const finalWinnings = ((0.05 * internalScore * internalScore) + (0.55 * internalScore) + 0.4) * totalScoreMultiplier;
    const tabBtnClasses = (isActive: boolean) => `flex-1 p-2 rounded-t-lg font-bold cursor-pointer transition-colors ${isActive ? 'bg-green-500/20 text-white' : 'bg-black/20 text-gray-400 hover:bg-black/40'}`;
    const controlBtnClasses = "w-full h-full bg-gray-700 text-white font-bold py-2 rounded-lg hover:bg-gray-600 active:bg-green-500 active:scale-95 transition-all disabled:opacity-50 disabled:active:bg-gray-700 disabled:active:scale-100";

    const isComboActive = uiComboState.multiplier >= 1.01;

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

                {/* Paralamas Indicator */}
                {snakeGameSettings.paralamasCharges > 0 && (
                    <div className="flex items-center justify-between w-full max-w-md text-xs mt-1 bg-blue-900/40 px-3 py-2 rounded-lg border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                        <span className="text-blue-300 font-bold flex items-center gap-1">
                            🛡️ <span className="uppercase tracking-widest text-[10px]">Paralamas</span>
                            <span className="text-white text-sm bg-black/40 px-2 rounded ml-1">
                                {snakeGameSettings.paralamasCharges - paralamasChargesUsed}/{snakeGameSettings.paralamasCharges}
                            </span>
                        </span>
                        {paralamasChargesUsed > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-[10px] uppercase">Recarga</span>
                                <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                                    <div 
                                        className="h-full bg-blue-400 transition-all duration-300 animate-pulse"
                                        style={{ width: `${Math.min(100, (applesSinceLastReset / rechargeThreshold) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Combo Display */}
                {uiComboState.isActive && uiComboState.timer > 0 && (
                    <div 
                        key={uiComboState.shake}
                        className="absolute right-2 top-[12%] flex flex-col items-end pointer-events-none z-20 origin-right transition-all duration-300"
                        style={{ 
                            transform: `scale(${1 + uiComboState.pulse * 0.15}) rotate(${(Math.random() - 0.5) * 5 * uiComboState.pulse}deg)` 
                        }}
                    >
                        {/* Background Plate */}
                        <div className="absolute inset-0 bg-black/70 -skew-x-12 transform scale-125 border-r-4 border-yellow-500/60 blur-[2px]"></div>
                        
                        <div className="relative flex flex-col items-end pr-3">
                            {/* Main Multiplier Text */}
                            <span 
                                className="text-6xl font-mono font-black italic tracking-tighter drop-shadow-2xl leading-none text-transparent bg-clip-text bg-gradient-to-t from-red-600 via-rose-400 to-white"
                                style={{ 
                                    textShadow: '3px 3px 0px rgba(0,0,0,1), -1px -1px 0 rgba(255,0,255,0.3), 1px 1px 0 rgba(0,255,255,0.3)',
                                    filter: `brightness(${1 + uiComboState.pulse * 0.3})`
                                }}
                            >
                                {uiComboState.multiplier.toFixed(2)}<span className="text-3xl">x</span>
                            </span>
                            
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90 bg-black/50 px-2 -mt-1 transform -skew-x-12 border border-white/20">
                                {uiComboState.count}x COMBO
                            </span>
                        </div>
                        
                        {/* Timer Bar Container */}
                        <div className="w-44 h-5 bg-gray-900 rounded-sm overflow-hidden border-2 border-white/30 mt-2 shadow-[0_0_15px_rgba(0,0,0,0.8)] skew-x-[-12deg] relative">
                            {(uiComboState.timer / uiComboState.maxTime) < 0.3 && (
                                <div className="absolute inset-0 bg-red-600/40 animate-pulse z-10"></div>
                            )}
                            
                            <div 
                                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-pink-600 via-red-500 to-orange-400 transition-all duration-100 ease-linear"
                                style={{ width: `${(uiComboState.timer / uiComboState.maxTime) * 100}%` }}
                            >
                                <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-b from-white/30 to-transparent"></div>
                            </div>
                            
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <span className="text-[11px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] font-mono tracking-wider">
                                    {(uiComboState.timer / 1000).toFixed(1)}s 
                                    <span className="text-[9px] opacity-70 ml-1">
                                        / {(uiComboState.maxTime / 1000).toFixed(1)}s
                                    </span>
                                </span>
                            </div>
                        </div>
                        
                        <div className="mt-1 text-right pr-1">
                            <span className="text-[9px] uppercase tracking-widest text-yellow-300/80 font-bold">
                                {uiComboState.count} {uiComboState.count === 1 ? 'MAÇÃ' : 'MAÇÃS'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Canvas Container & Overlays */}
                <div className={`relative transition-transform duration-100 ${isDashingVisual ? 'scale-105' : 'scale-100'}`}>
                    <canvas ref={canvasRef} width={canvasSize} height={canvasSize} className={`bg-gray-900 rounded-lg border-2 border-green-700 shadow-lg ${isDashingVisual ? 'brightness-125' : ''}`} />
                    
                    {/* Alerta Sutil */}
                    {subtleAlertLevel > 0 && appleInfo && !gameOver && (
                        <div className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center pointer-events-none animate-pulse">
                            <span className="text-2xl drop-shadow-md">
                                {appleInfo.closest.type === 'golden' ? '🍏' : '🍎'}
                            </span>
                            {subtleAlertLevel >= 2 && food.length > 1 && (
                                <span className="absolute -bottom-1 -right-1 text-xs font-bold text-white bg-black/50 px-1 rounded">
                                    +{food.length - 1}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Alerta Alarmante */}
                    {alarmingAlertLevel > 0 && appleInfo && !gameOver && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div 
                                className="w-20 h-20 flex items-center justify-center opacity-60 transition-transform duration-200 ease-linear"
                                style={{ transform: `rotate(${appleInfo.angle}deg)` }}
                            >
                                <span className="text-6xl text-red-500 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] animate-pulse">
                                    ➜
                                </span>
                            </div>
                            {alarmingAlertLevel >= 2 && (
                                <div className="absolute mt-16 bg-black/70 px-2 py-1 rounded text-xs font-bold text-white">
                                    {appleInfo.minDist}m
                                    {alarmingAlertLevel >= 3 && (
                                        <span className={appleInfo.closest.type === 'golden' ? 'text-yellow-400' : 'text-red-400'}>
                                            {appleInfo.closest.type === 'golden' ? ' (OURO)' : ' (N)'}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Slow Mo Visual Overlay */}
                    {slowMoActive && (
                        <div className="absolute inset-0 rounded-lg pointer-events-none border-4 border-blue-400 animate-pulse shadow-[inset_0_0_50px_rgba(59,130,246,0.5)] flex items-center justify-center">
                            <span className="text-blue-300 font-black text-4xl opacity-50 tracking-widest rotate-12">SLOW MO</span>
                        </div>
                    )}
                </div>

                {/* Dash Cooldown Indicator */}
                {hasDashSkill && (
                    <div className="w-full max-w-xs mt-1">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">
                                {dashCooldownTimer > 0 ? 'Recarregando...' : 'DASH PRONTO!'}
                            </span>
                            <span className={dashCooldownTimer > 0 ? 'text-red-400' : 'text-blue-400 font-bold animate-pulse'}>
                                {dashCooldownTimer > 0 
                                    ? `${(dashCooldownTimer / 1000).toFixed(1)}s` 
                                    : '⚡ Toque 2x'}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-100 ${
                                    dashCooldownTimer > 0 
                                        ? 'bg-gradient-to-r from-red-600 to-red-400' 
                                        : 'bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse'
                                }`}
                                style={{ 
                                    width: `${Math.max(0, (1 - dashCooldownTimer / DASH_COOLDOWN) * 100)}%` 
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Controls Area */}
                <div className="flex items-center justify-center gap-4 mt-2">
                    {/* D-PAD */}
                    <div className="w-full max-w-[180px] aspect-square grid grid-cols-3 grid-rows-3 gap-1">
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
