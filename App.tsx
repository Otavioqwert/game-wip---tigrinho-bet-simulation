import React, { useState, useRef } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { usePanAndZoom } from './hooks/usePanAndZoom';
import Header from './components/Header';
import SlotMachine from './components/slot/SlotMachine';
import InventoryTab from './components/InventoryTab';
import ShopsTab from './components/ShopsTab';
import ConfigTab from './components/ConfigTab';
import PrestigeTab from './components/prestige/PrestigeTab';
import SnakeGame from './components/minigames/snake/SnakeGame';
import CreditCardManager, { PaymentDueModal, ItemPenaltyModal } from './components/CreditCardManager';

const App: React.FC = () => {
    const game = useGameLogic();
    const [mainActiveTab, setMainActiveTab] = useState(0);
    const [topLevelTab, setTopLevelTab] = useState('caça-niquel');
    const { style, scale, zoomIn, zoomOut, panHandlers, isPanModeActive, togglePanMode } = usePanAndZoom();
    
    // Swipe navigation logic
    const touchStart = useRef(0);
    const touchEnd = useRef(0);
    const swipeThreshold = 50;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (scale > 1) return; // Disable swipe when zoomed
        touchStart.current = e.targetTouches[0].clientX;
        touchEnd.current = e.targetTouches[0].clientX;
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (scale > 1) return;
        touchEnd.current = e.targetTouches[0].clientX;
    };
    const handleTouchEnd = () => {
        if (scale > 1) return;
        if (touchStart.current - touchEnd.current > swipeThreshold) {
            setMainActiveTab(prev => Math.min(prev + 1, 3));
        }
        if (touchEnd.current - touchStart.current > swipeThreshold) {
            setMainActiveTab(prev => Math.max(prev - 1, 0));
        }
    };


    const tabBtnClasses = (isActive: boolean) => `flex-1 p-2 rounded-t-lg font-bold cursor-pointer transition-colors ${isActive ? 'bg-yellow-500 text-stone-900' : 'bg-yellow-500/20 text-white hover:bg-yellow-500/30'}`;

    const isPrestigeView = topLevelTab === 'prestigio';

    const BG_CLASS = isPrestigeView
        ? "from-indigo-800 via-purple-900 to-fuchsia-950"
        : game.febreDocesAtivo
            ? "from-[#ffadf6] via-[#e03aff] to-[#ff00b4]"
            : "from-[#1a0e0e] to-[#3d1a1a]";

    const topLevelBtnBaseClasses = 'flex-1 py-3 text-lg font-bold rounded-lg transition-all duration-300 transform hover:-translate-y-1';
    const topLevelBtnActiveClasses = 'scale-105 shadow-inner';
    const topLevelBtnInactiveClasses = 'opacity-70 hover:opacity-100';


    return (
        <div className={`h-screen flex flex-col items-center font-sans text-white bg-gradient-to-br ${BG_CLASS} transition-all duration-500 py-4 sm:py-8 px-4 overflow-hidden`}>
            {game.isSnakeGameActive && <SnakeGame
                onClose={game.endSnakeGame}
                bal={game.bal}
                snakeUpgrades={game.snakeUpgrades}
                buySnakeUpgrade={game.buySnakeUpgrade}
                snakeGameSettings={game.snakeGameSettings}
                totalScoreMultiplier={game.totalIncomeMultiplier * game.scoreMultiplier}
                resetSnakeUpgrades={game.resetSnakeUpgrades}
            />}
            <CreditCardManager
                creditCardLevel={game.creditCardLevel}
                creditCardDebt={game.creditCardDebt}
                openCreditCardModal={game.openCreditCardModal}
                isCreditCardModalOpen={game.isCreditCardModalOpen}
                closeCreditCardModal={game.closeCreditCardModal}
                creditLimit={game.creditLimit}
                renegotiationTier={game.renegotiationTier}
                payOffCreditCardDebt={game.payOffCreditCardDebt}
                renegotiateCreditCard={game.renegotiateCreditCard}
                takeCreditCardLoan={game.takeCreditCardLoan}
                currentInstallment={game.currentInstallment}
                handlePayInstallment={game.handlePayInstallment}
                bal={game.bal}
            />
             <PaymentDueModal 
                isOpen={game.isPaymentDueModalOpen}
                onClose={game.closePaymentDueModal}
                onPay={game.handlePayInstallment}
                onPostpone={game.handlePostponeInstallment}
                debt={game.creditCardDebt}
                installmentAmount={game.currentInstallment}
            />
            <ItemPenaltyModal 
                isOpen={game.isItemPenaltyModalOpen}
                onClose={game.closeItemPenaltyModal}
                onPay={game.handlePayItemPenalty}
                penalty={game.itemPenaltyDue}
                inventory={game.inv}
            />
            <div className="fixed left-4 top-4 bg-black/35 p-2 rounded-lg flex items-center gap-2 border-2 border-yellow-500 shadow-lg z-10">
                <button onClick={zoomOut} className="px-2 font-bold text-lg leading-none bg-yellow-500 text-stone-900 rounded disabled:opacity-50" disabled={scale <= 0.25}>-</button>
                <span className="font-bold text-white tabular-nums">{scale.toFixed(2)}x</span>
                <button onClick={zoomIn} className="px-2 font-bold text-lg leading-none bg-yellow-500 text-stone-900 rounded disabled:opacity-50" disabled={scale >= 10}>+</button>
                <button
                    onClick={togglePanMode}
                    className={`p-1.5 rounded transition-colors ${
                        isPanModeActive
                            ? 'bg-yellow-500 text-stone-900'
                            : 'bg-stone-700 text-white hover:bg-stone-600'
                    }`}
                    title="Modo Agarrar e Deslizar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                      <path d="M10 3.5a1.5 1.5 0 011.456 1.842l-1.01 4.418a.5.5 0 00.91.4l1.554-1.554a1.5 1.5 0 012.122 2.121l-4.243 4.242a1.5 1.5 0 01-2.121 0l-4.242-4.242a1.5 1.5 0 112.12-2.121l1.555 1.554a.5.5 0 00.91-.4L8.544 5.342A1.5 1.5 0 0110 3.5z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Top Level Navigation */}
            <div className="w-full max-w-2xl mb-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => setTopLevelTab('caça-niquel')}
                        className={`
                            ${topLevelBtnBaseClasses}
                            bg-yellow-950 text-yellow-300 border-2 border-yellow-500
                            shadow-[0_0_5px_#eab308,0_0_15px_#ca8a04]
                            ${topLevelTab === 'caça-niquel' ? topLevelBtnActiveClasses : topLevelBtnInactiveClasses}
                        `}
                    >
                        Caça-Níquel
                    </button>
                    <button
                        onClick={() => setTopLevelTab('prestigio')}
                        className={`
                            ${topLevelBtnBaseClasses}
                            bg-black text-purple-300 border-2 border-purple-500
                            shadow-[0_0_5px_#a855f7,0_0_15px_#8b5cf6]
                            ${topLevelTab === 'prestigio' ? topLevelBtnActiveClasses : topLevelBtnInactiveClasses}
                        `}
                    >
                        Prestigio
                    </button>
                </div>
            </div>

            {/* Main Content Area Wrapper for Pan and Zoom */}
            <div 
                className={`w-full ${isPrestigeView ? 'max-w-7xl' : 'max-w-2xl'} flex-grow overflow-hidden transition-all duration-300`}
                {...panHandlers}
            >
                <div
                    className="w-full h-full"
                    style={style}
                >
                    {isPrestigeView ? (
                        <PrestigeTab {...game} />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#2a1810] to-[#1f1108] rounded-3xl p-5 shadow-2xl shadow-yellow-500/10 border-4 border-yellow-800 flex flex-col">
                            <Header
                                bal={game.bal}
                                betVal={game.betVal}
                                betValFebre={game.betValFebre}
                                febreDocesAtivo={game.febreDocesAtivo}
                                momentoLevel={game.momentoLevel}
                                momentoProgress={game.momentoProgress}
                            />
                            {/* Main Tabs Navigation */}
                            <div className="flex gap-1 mb-2">
                                {['Caça-Níquel', 'Inventário', 'Lojas', 'Config'].map((label, i) => (
                                    <button key={i} onClick={() => setMainActiveTab(i)} className={tabBtnClasses(mainActiveTab === i)}>
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Main Content Area */}
                            <main 
                                className="bg-black/30 rounded-b-lg rounded-tr-lg p-4 flex-grow overflow-y-auto"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                {mainActiveTab === 0 && <SlotMachine {...game} />}
                                {mainActiveTab === 1 && <InventoryTab inv={game.inv} roiSaldo={game.roiSaldo} momentoLevel={game.momentoLevel} momentoProgress={game.momentoProgress} />}
                                {mainActiveTab === 2 && <ShopsTab {...game} />}
                                {mainActiveTab === 3 && <ConfigTab {...game} />}
                            </main>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;