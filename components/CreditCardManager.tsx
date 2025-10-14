import React, { useState } from 'react';
import type { RenegotiationTier } from '../types';

interface CreditCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    debt: number;
    limit: number;
    renegotiationTier: RenegotiationTier;
    payInstallment: () => void;
    payOffDebt: () => void;
    renegotiate: (tier: RenegotiationTier) => void;
    takeCreditCardLoan: (amount: number) => void;
}

const CreditCardModal: React.FC<CreditCardModalProps> = ({
    isOpen, onClose, debt, limit, renegotiationTier, payInstallment, payOffDebt, renegotiate, takeCreditCardLoan
}) => {
    const [loanAmount, setLoanAmount] = useState<number>(0);
    
    if (!isOpen) return null;

    const availableCredit = limit - debt;
    const installmentDenominator = [24, 48, 60][renegotiationTier];
    const interestRate = [15, 21, 29][renegotiationTier];
    const currentInstallment = debt > 0 ? (debt / installmentDenominator) : 0;

    const modalBtnClasses = "py-2 px-4 font-bold rounded-lg shadow-md transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (isNaN(value)) {
            setLoanAmount(0);
        } else {
            setLoanAmount(Math.max(0, Math.min(availableCredit, value)));
        }
    };

    const handleTakeLoan = () => {
        if (loanAmount > 0) {
            takeCreditCardLoan(loanAmount);
            setLoanAmount(0); // Reset after taking loan
            onClose(); // Close modal after action
        }
    };
    
    const quickBtnClasses = "flex-1 text-sm py-1 rounded bg-sky-800 hover:bg-sky-700 transition-colors";


    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 shadow-2xl border-4 border-sky-500 w-full max-w-md text-white">
                <button onClick={onClose} className="absolute top-2 right-3 text-gray-400 hover:text-white transition-colors text-3xl font-bold">&times;</button>
                <h3 className="text-2xl font-bold text-sky-400 mb-4 text-center">💳 Gerenciar Cartão de Crédito</h3>

                <div className="bg-black/30 rounded-lg p-4 mb-6 text-center">
                    <p className="text-sm text-gray-400">Dívida Atual</p>
                    <p className="text-3xl font-bold text-red-400">${debt.toFixed(2)}</p>
                    <p className="text-sm text-gray-400 mt-1">Limite: ${limit.toFixed(2)}</p>
                </div>

                {debt > 0 ? (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-lg text-yellow-300">Pagamento</h4>
                            <p className="text-sm text-gray-400 mb-2">Próxima parcela estimada: ${currentInstallment.toFixed(2)}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={payInstallment} disabled={debt <= 0} className={`${modalBtnClasses} bg-yellow-500 text-black hover:bg-yellow-400`}>
                                    Pagar Parcela
                                </button>
                                <button onClick={payOffDebt} disabled={debt <= 0} className={`${modalBtnClasses} bg-green-500 text-black hover:bg-green-400`}>
                                    Quitar Dívida
                                </button>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-yellow-300">Renegociar</h4>
                            <p className="text-sm text-gray-400 mb-2">Altere seu plano de pagamento. Juros maiores para prazos mais longos.</p>
                            <div className="bg-black/20 p-3 rounded-lg space-y-2">
                                <p className="text-center text-sm">Plano Atual: {installmentDenominator}x / {interestRate}% juros</p>
                                <div className="flex gap-2">
                                    <button onClick={() => renegotiate(1)} disabled={renegotiationTier >= 1} className={`${modalBtnClasses} flex-1 bg-sky-600 hover:bg-sky-500`}>
                                        48 Parcelas (21% Juros)
                                    </button>
                                    <button onClick={() => renegotiate(2)} disabled={renegotiationTier >= 2} className={`${modalBtnClasses} flex-1 bg-sky-700 hover:bg-sky-600`}>
                                        60 Parcelas (29% Juros)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h4 className="font-bold text-lg text-yellow-300">Pegar Empréstimo</h4>
                        <p className="text-sm text-gray-400 mb-2">Crédito disponível: ${availableCredit.toFixed(2)}</p>
                         <div className="bg-black/20 p-3 rounded-lg space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="font-bold">$</span>
                                <input 
                                    type="number" 
                                    value={loanAmount}
                                    onChange={handleLoanAmountChange}
                                    className="w-full bg-gray-900 text-white p-2 rounded-md border border-sky-700 text-center text-lg"
                                    placeholder="0.00"
                                    max={availableCredit}
                                    min="0"
                                />
                            </div>
                            <input 
                                type="range"
                                min="0"
                                max={availableCredit}
                                value={loanAmount}
                                onChange={handleLoanAmountChange}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                step="0.01"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setLoanAmount(availableCredit * 0.25)} className={quickBtnClasses}>25%</button>
                                <button onClick={() => setLoanAmount(availableCredit * 0.50)} className={quickBtnClasses}>50%</button>
                                <button onClick={() => setLoanAmount(availableCredit * 0.75)} className={quickBtnClasses}>75%</button>
                                <button onClick={() => setLoanAmount(availableCredit)} className={quickBtnClasses}>MAX</button>
                            </div>
                            <button onClick={handleTakeLoan} disabled={loanAmount <= 0 || loanAmount > availableCredit} className={`${modalBtnClasses} w-full bg-green-500 text-black hover:bg-green-400`}>
                                Pegar ${loanAmount.toFixed(2)}
                            </button>
                         </div>
                    </div>
                )}

            </div>
        </div>
    );
};


interface CreditCardManagerWrapperProps {
    creditCardLevel: number;
    creditCardDebt: number;
    openCreditCardModal: () => void;
    isCreditCardModalOpen: boolean;
    closeCreditCardModal: () => void;
    creditLimit: number;
    renegotiationTier: RenegotiationTier;
    payCreditCardInstallment: () => void;
    payOffCreditCardDebt: () => void;
    renegotiateCreditCard: (tier: RenegotiationTier) => void;
    takeCreditCardLoan: (amount: number) => void;
}

const CreditCardManager: React.FC<CreditCardManagerWrapperProps> = (props) => {
    const { 
        creditCardLevel, creditCardDebt, openCreditCardModal, isCreditCardModalOpen,
        closeCreditCardModal, creditLimit, renegotiationTier, payCreditCardInstallment,
        payOffCreditCardDebt, renegotiateCreditCard, takeCreditCardLoan
    } = props;

    if (creditCardLevel === 0) return null;

    return (
        <>
            <button 
                onClick={openCreditCardModal}
                className={`fixed bottom-4 right-4 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-full h-16 w-16 flex items-center justify-center text-3xl shadow-lg z-20 transition-transform hover:scale-110 ${creditCardDebt > 0 ? 'animate-pulse' : ''}`}
                aria-label="Gerenciar cartão de crédito"
            >
                💳
                {creditCardDebt > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-1 border-2 border-white">
                        ${creditCardDebt.toFixed(0)}
                    </span>
                )}
            </button>
            <CreditCardModal
                isOpen={isCreditCardModalOpen}
                onClose={closeCreditCardModal}
                debt={creditCardDebt}
                limit={creditLimit}
                renegotiationTier={renegotiationTier}
                payInstallment={payCreditCardInstallment}
                payOffDebt={payOffCreditCardDebt}
                renegotiate={renegotiateCreditCard}
                takeCreditCardLoan={takeCreditCardLoan}
            />
        </>
    );
}

export default CreditCardManager;