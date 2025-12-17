
import React from 'react';
import type { PoolDensityMetrics } from '../utils/poolMetrics';

interface Props {
    metrics: PoolDensityMetrics;
}

const PoolHealthIndicator: React.FC<Props> = ({ metrics }) => {
    const { hitChance, healthStatus, totalItems, meteorCount } = metrics;

    let colorClass = 'bg-green-500';
    let textColor = 'text-green-400';
    let borderColor = 'border-green-500/30';
    let message = 'Pool Balanceado';
    let icon = '✅';

    if (healthStatus === 'warning') {
        colorClass = 'bg-yellow-500';
        textColor = 'text-yellow-400';
        borderColor = 'border-yellow-500/30';
        message = 'Atenção: Diluição Alta';
        icon = '⚠️';
    } else if (healthStatus === 'critical') {
        colorClass = 'bg-red-600';
        textColor = 'text-red-500';
        borderColor = 'border-red-500/30';
        message = 'CRÍTICO: Pool Poluído!';
        icon = '🚨';
    }

    // Clamp progress for display (logarithmic scale feels better for probabilities)
    // 0-100 visual scale mapped roughly to 0-30% real hit chance for better feedback
    const displayProgress = Math.min(100, (hitChance / 25) * 100);

    return (
        <div className={`bg-black/40 rounded-xl p-3 border ${borderColor} mb-4`}>
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h4 className="text-xs text-gray-400 uppercase tracking-widest font-bold">Saúde do Pool</h4>
                    <p className={`font-bold ${textColor} flex items-center gap-1`}>
                        {icon} {message}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-white">{hitChance.toFixed(2)}%</span>
                    <span className="text-xs text-gray-500 block">Chance de Linha</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-2 relative">
                {/* Zones indicators background */}
                <div className="absolute inset-0 flex w-full h-full opacity-20">
                    <div className="w-[20%] bg-red-500 h-full"></div>
                    <div className="w-[40%] bg-yellow-500 h-full"></div>
                    <div className="w-[40%] bg-green-500 h-full"></div>
                </div>
                <div 
                    className={`h-full ${colorClass} transition-all duration-500 shadow-[0_0_10px_currentColor]`}
                    style={{ width: `${displayProgress}%` }}
                ></div>
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>Total: {totalItems} itens</span>
                {meteorCount > 0 && <span className={healthStatus === 'critical' ? 'text-red-400 font-bold' : ''}>Meteoros: {meteorCount}</span>}
            </div>
        </div>
    );
};

export default PoolHealthIndicator;
