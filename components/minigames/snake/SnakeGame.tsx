import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SnakeUpgradeId } from '../../../types';
import SnakeUpgrades from './SnakeUpgrades';

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const BASE_GAME_SPEED = 150; // ms

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Food = { x: number; y: number; type: 'normal' | 'golden' };

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
    };
    totalScoreMultiplier: number;
    resetSnakeUpgrades: () => void;
}

const getInitialSnake = (length: number) => {
    return Array.from({ length }, (_, i) => ({ x: 10 - i, y: 10 }));
};

const SnakeGame: React.FC<SnakeGameProps> = (props) => {
    const { onClose, bal, snakeUpgrades, buySnakeUpgrade, snakeGameSettings, totalScoreMultiplier, resetSnakeUpgrades } = props;
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [snake, setSnake] = useState(() => getInitialSnake(snakeGameSettings.initialLength));
    const [food, setFood] = useState<Food[]>([]);
    const [score, setScore] = useState(0);
    const [internalScore, setInternalScore] = useState(0); // For combo calculations
    const [gameOver, setGameOver] = useState(false);
    const [lives, setLives] = useState(snakeGameSettings.lives);
    const directionRef = useRef<Direction>('RIGHT');
    const [gameOverTab, setGameOverTab] = useState('result');

    const generateFood = useCallback(() => {
        setFood(prevFood => {
            let applesToAdd = 0;
            const roll = Math.random();
            const chances = snakeGameSettings.frenzyChances; // e.g. [0.1, 0.025, ...] for +1 to +5 apples
            let cumulativeProb = 0;

            const tierChances = [chances[4], chances[3], chances[2], chances[1], chances[0]]; // Check for rare outcomes first
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
                    newFoodPosition = {
                        x: Math.floor(Math.random() * GRID_SIZE),
                        y: Math.floor(Math.random() * GRID_SIZE),
                    };
                } while (existingPositions.some(p => p.x === newFoodPosition.x && p.y === newFoodPosition.y));

                newFoodItems.push({
                    ...newFoodPosition,
                    type: Math.random() < snakeGameSettings.goldenAppleChance ? 'golden' : 'normal'
                });
                existingPositions.push(newFoodPosition);
            }
            return [...prevFood, ...newFoodItems];
        });
    }, [snake, snakeGameSettings.frenzyChances, snakeGameSettings.goldenAppleChance]);

    useEffect(() => {
        if (food.length === 0) {
            generateFood();
        }
    }, [food.length, generateFood]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const keyMap: { [key: string]: Direction } = {
            ArrowUp: 'UP', w: 'UP',
            ArrowDown: 'DOWN', s: 'DOWN',
            ArrowLeft: 'LEFT', a: 'LEFT',
            ArrowRight: 'RIGHT', d: 'RIGHT',
        };
        const newDir = keyMap[e.key.toLowerCase()];
        if (!newDir) return;
        
        const currentDir = directionRef.current;
        const oppositeDirs: Record<Direction, Direction> = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT' };

        if (newDir !== oppositeDirs[currentDir]) {
            directionRef.current = newDir;
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    useEffect(() => {
        if (gameOver) return;

        const gameLoop = setInterval(() => {
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
                
                const snakeToCheck = isEating ? prevSnake : prevSnake.slice(0, prevSnake.length - 1);
                const isSelfCollision = snakeToCheck.some(segment => segment.x === newHead.x && segment.y === newHead.y);
                const isWallCollision = newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE;

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
                
                const newSnake = [newHead, ...prevSnake];

                if (isEating) {
                    const eatenFood = food[eatenFoodIndex];
                    const pointValue = 1 + snakeGameSettings.applePointBonus;
                    const scoreIncrease = eatenFood.type === 'golden' ? 5 * pointValue : pointValue;
                    
                    setScore(s => s + 1);
                    setInternalScore(s => s + scoreIncrease);
                    setFood(f => f.filter((_, i) => i !== eatenFoodIndex));
                } else {
                    newSnake.pop();
                }
                
                return newSnake;
            });
        }, BASE_GAME_SPEED * snakeGameSettings.speedModifier);

        return () => clearInterval(gameLoop);
    }, [gameOver, food, lives, generateFood, snakeGameSettings]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.fillStyle = '#48bb78';
        snake.forEach(segment => {
            ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        });
        
        food.forEach(f => {
            ctx.fillStyle = f.type === 'golden' ? '#FBBF24' : '#f56565';
            ctx.fillRect(f.x * CELL_SIZE, f.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        });

    }, [snake, food]);
    
    const finalWinnings = ((0.05 * internalScore * internalScore) + (0.55 * internalScore) + 0.4) * totalScoreMultiplier;

    const tabBtnClasses = (isActive: boolean) => `flex-1 p-2 rounded-t-lg font-bold cursor-pointer transition-colors ${isActive ? 'bg-green-500/20 text-white' : 'bg-black/20 text-gray-400 hover:bg-black/40'}`;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="relative bg-gradient-to-br from-gray-800 to-black rounded-2xl p-6 shadow-2xl border-4 border-green-500 w-full max-w-lg text-white text-center max-h-full overflow-y-auto">
                <h2 className="text-3xl font-bold text-green-400 mb-2">Snake Game</h2>
                <div className="flex justify-between items-center mb-2 px-4 text-lg">
                    <span>Vidas: <span className="font-bold text-red-400">{'❤️'.repeat(lives)}</span></span>
                    <span>Maçãs: <span className="font-bold text-yellow-400">{score}</span></span>
                    <span>Ganhos: <span className="font-bold text-green-400">${finalWinnings.toFixed(2)}</span></span>
                </div>
                <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="bg-gray-900 rounded-lg mx-auto mb-4 border-2 border-green-700" />

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