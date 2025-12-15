
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SnakeUpgradeId } from '../../../types';
import SnakeUpgrades from './SnakeUpgrades';

const GRID_SIZE = 20;
const BASE_GAME_SPEED = 150; // ms

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Food = { x: number; y: number; type: 'normal' | 'golden' };
type SnakeSegment = { x: number; y: number };

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
        applePointBonus: number;
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

    // Refs for animation and game state
    const animationFrameRef = useRef<number>(0);
    const lastLogicUpdateTimeRef = useRef(0);
    const directionRef = useRef<Direction>('RIGHT');
    const prevSnakeRef = useRef<SnakeSegment[]>([]);

    useEffect(() => {
        const handleResize = () => {
            const verticalPadding = 280;
            const horizontalPadding = 40;
            const size = Math.min(window.innerWidth - horizontalPadding, window.innerHeight - verticalPadding);
            setCanvasSize(Math.max(200, size));
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const CELL_SIZE = canvasSize / GRID_SIZE;

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
            const existingPositions = [...snake, ...prevFood, ...newFoodItems];

            for(let i = 0; i < numToGenerate; i++) {
                let newFoodPosition;
                do {
                    newFoodPosition = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
                } while (existingPositions.some(p => p.x === newFoodPosition.x && p.y === newFoodPosition.y));

                newFoodItems.push({ ...newFoodPosition, type: Math.random() < snakeGameSettings.goldenAppleChance ? 'golden' : 'normal' });
                existingPositions.push(newFoodPosition);
            }
            return [...prevFood, ...newFoodItems];
        });
    }, [snake, snakeGameSettings.frenzyChances, snakeGameSettings.goldenAppleChance]);

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

    const changeDirection = useCallback((newDir: Direction) => {
        if (gameOver) return;
        const currentDir = directionRef.current;
        const oppositeDirs: Record<Direction, Direction> = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT' };
        if (newDir !== oppositeDirs[currentDir]) {
            directionRef.current = newDir;
        }
    }, [gameOver]);

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

        const gameSpeed = BASE_GAME_SPEED * snakeGameSettings.speedModifier;
        const timeSinceLastUpdate = timestamp - lastLogicUpdateTimeRef.current;

        // --- Logic Update Step ---
        if (timeSinceLastUpdate > gameSpeed) {
            lastLogicUpdateTimeRef.current = timestamp;
            prevSnakeRef.current = snake; // Store current snake state before update

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
                    
                    if (newHead.y < 0) { // Top wall
                        newHead.y = 2;
                        newDirection = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
                    } else if (newHead.y >= GRID_SIZE) { // Bottom wall
                        newHead.y = GRID_SIZE - 3;
                        newDirection = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
                    } else if (newHead.x < 0) { // Left wall
                        newHead.x = 2;
                        newDirection = Math.random() < 0.5 ? 'UP' : 'DOWN';
                    } else { // Right wall
                        newHead.x = GRID_SIZE - 3;
                        newDirection = Math.random() < 0.5 ? 'UP' : 'DOWN';
                    }
                    
                    directionRef.current = newDirection;

                    const newSnakeBody: SnakeSegment[] = [newHead];
                    let lastSegment = newHead;
                    for (let i = 1; i < prevSnake.length; i++) {
                        let nextX = lastSegment.x;
                        let nextY = lastSegment.y;
                        switch (newDirection) {
                            case 'UP': nextY++; break;
                            case 'DOWN': nextY--; break;
                            case 'LEFT': nextX++; break;
                            case 'RIGHT': nextX--; break;
                        }
                        const nextSegment = { x: nextX, y: nextY };
                        newSnakeBody.push(nextSegment);
                        lastSegment = nextSegment;
                    }
                    return newSnakeBody;
                }
                
                const snakeToCheck = isEating ? prevSnake : prevSnake.slice(0, prevSnake.length - 1);
                const isSelfCollision = snakeToCheck.some(segment => segment.x === newHead.x && segment.y === newHead.y);
                
                if (isWallCollision || isSelfCollision) {
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
                    const pointValue = 1 + snakeGameSettings.applePointBonus;
                    const scoreIncrease = eatenFood.type === 'golden' ? 5 * pointValue : pointValue;
                    
                    setScore(s => s + 1);
                    setInternalScore(s => s + scoreIncrease);
                    setFood(f => f.filter((_, i) => i !== eatenFoodIndex));
                    setApplesSinceLastReset(a => a + 1);
                } else {
                    newSnake.pop();
                }
                
                return newSnake;
            });
        }

        // --- Render Step (happens every frame) ---
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        
        // 1. Draw Background
        ctx.fillStyle = '#1a202c'; // Dark blue-gray
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.strokeStyle = '#2d3748'; // Slightly lighter grid lines
        ctx.lineWidth = 1;
        for (let i = 1; i < GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, canvasSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(canvasSize, i * CELL_SIZE);
            ctx.stroke();
        }

        const progress = Math.min(1, timeSinceLastUpdate / gameSpeed);

        // 2. Draw Food
        food.forEach(f => {
            const appleX = f.x * CELL_SIZE + CELL_SIZE / 2;
            const appleY = f.y * CELL_SIZE + CELL_SIZE / 2;
            const radius = CELL_SIZE / 2 * 0.8;

            ctx.fillStyle = f.type === 'golden' ? '#FBBF24' : '#f56565';
            ctx.beginPath();
            ctx.arc(appleX, appleY, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(appleX - radius * 0.3, appleY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // 3. Draw Snake
        const snakeBodyGradient = ctx.createLinearGradient(0, 0, 0, canvasSize);
        snakeBodyGradient.addColorStop(0, '#a3ff00');
        snakeBodyGradient.addColorStop(1, '#69c200');

        snake.slice(1).forEach((segment, index) => {
            const prevSegment = prevSnakeRef.current[index + 1] || segment;
            
            const interpX = (prevSegment.x + (segment.x - prevSegment.x) * progress) * CELL_SIZE;
            const interpY = (prevSegment.y + (segment.y - prevSegment.y) * progress) * CELL_SIZE;
            
            const padding = CELL_SIZE * 0.1;
            const segmentSize = CELL_SIZE - padding * 2;
            
            ctx.fillStyle = snakeBodyGradient;
            ctx.strokeStyle = '#234d20';
            ctx.lineWidth = 2;
            
            drawRoundRect(ctx, interpX + padding, interpY + padding, segmentSize, segmentSize, 5);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = 'rgba(35, 77, 32, 0.5)';
            ctx.lineWidth = 2;
            const stripeOffset1 = segmentSize * 0.3;
            const stripeOffset2 = segmentSize * 0.7;
            ctx.beginPath();
            ctx.moveTo(interpX + padding, interpY + padding + stripeOffset1);
            ctx.lineTo(interpX + padding + segmentSize, interpY + padding + stripeOffset1);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(interpX + padding, interpY + padding + stripeOffset2);
            ctx.lineTo(interpX + padding + segmentSize, interpY + padding + stripeOffset2);
            ctx.stroke();
        });
        
        const snakeHead = snake[0];
        if (snakeHead) {
            const prevSnakeHead = prevSnakeRef.current[0] || snakeHead;
            const headX = (prevSnakeHead.x + (snakeHead.x - prevSnakeHead.x) * progress) * CELL_SIZE;
            const headY = (prevSnakeHead.y + (snakeHead.y - prevSnakeHead.y) * progress) * CELL_SIZE;

            const headPadding = CELL_SIZE * 0.05;
            const headSize = CELL_SIZE - headPadding * 2;
            
            ctx.fillStyle = snakeBodyGradient;
            ctx.strokeStyle = '#1e421c';
            ctx.lineWidth = 3;
            drawRoundRect(ctx, headX + headPadding, headY + headPadding, headSize, headSize, 8);
            ctx.fill();
            ctx.stroke();

            const eyeSize = CELL_SIZE * 0.1;
            let eye1 = { x: 0, y: 0 };
            let eye2 = { x: 0, y: 0 };
            const headCenterX = headX + CELL_SIZE / 2;
            const headCenterY = headY + CELL_SIZE / 2;
            const offset = CELL_SIZE * 0.25;

            switch (directionRef.current) {
                case 'UP':
                    eye1 = { x: headCenterX - offset, y: headCenterY - offset };
                    eye2 = { x: headCenterX + offset, y: headCenterY - offset };
                    break;
                case 'DOWN':
                    eye1 = { x: headCenterX - offset, y: headCenterY + offset };
                    eye2 = { x: headCenterX + offset, y: headCenterY + offset };
                    break;
                case 'LEFT':
                    eye1 = { x: headCenterX - offset, y: headCenterY - offset };
                    eye2 = { x: headCenterX - offset, y: headCenterY + offset };
                    break;
                case 'RIGHT':
                    eye1 = { x: headCenterX + offset, y: headCenterY - offset };
                    eye2 = { x: headCenterX + offset, y: headCenterY + offset };
                    break;
            }

            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(eye1.x, eye1.y, eyeSize, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(eye2.x, eye2.y, eyeSize, 0, Math.PI * 2); ctx.fill();
            
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(eye1.x, eye1.y, eyeSize * 0.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(eye2.x, eye2.y, eyeSize * 0.5, 0, Math.PI * 2); ctx.fill();
        }

    }, [snake, food, gameOver, lives, canvasSize, CELL_SIZE, snakeGameSettings, paralamasChargesUsed]);

    useEffect(() => {
        prevSnakeRef.current = snake;
        lastLogicUpdateTimeRef.current = performance.now();
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
            <div className="relative bg-gradient-to-br from-gray-800 to-black rounded-2xl p-4 shadow-2xl border-4 border-green-500 w-full h-full text-white text-center flex flex-col items-center justify-center overflow-hidden gap-2">
                <h2 className="text-3xl font-bold text-green-400">Snake Game</h2>
                <div className="grid grid-cols-2 gap-x-4 w-full max-w-md text-lg">
                    <span className="text-left">Vidas: <span className="font-bold text-red-400">{'❤️'.repeat(lives)}</span></span>
                    <span className="text-right">Maçãs: <span className="font-bold text-yellow-400">{score}</span></span>
                     {snakeGameSettings.paralamasCharges > 0 && (
                        <span className="text-left col-span-2 text-base">
                            Paralamas: <span className="font-bold text-cyan-400">{'🛡️'.repeat(snakeGameSettings.paralamasCharges - paralamasChargesUsed)}</span>
                            {paralamasChargesUsed > 0 && <span className="text-sm text-gray-400"> (Próxima em {10 - applesSinceLastReset} maçãs)</span>}
                        </span>
                    )}
                    <span className="text-center col-span-2 mt-1">Ganhos: <span className="font-bold text-green-400">${finalWinnings.toFixed(2)}</span></span>
                </div>
                <canvas ref={canvasRef} width={canvasSize} height={canvasSize} className="bg-gray-900 rounded-lg border-2 border-green-700" />

                <div className="w-full max-w-[200px] aspect-square grid grid-cols-3 grid-rows-3 gap-1">
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
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center rounded-2xl p-6 overflow-y-auto">
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
