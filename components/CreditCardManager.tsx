
import React, { useState, useMemo } from 'react';
import type { RenegotiationTier, SymbolKey, Inventory } from '../types';
import { ITEM_PENALTY_VALUES } from '../constants';
import type { ItemPenalty } from '../hooks/useGameState';

// --- MAIN MODAL for managing loans/renegotiation ---
interface CreditCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    debt: number;
    limit: number;
    renegotiationTier: RenegotiationTier;
    payOffDebt: () => void;
    renegotiate: (tier: RenegotiationTier) => void;
    takeCreditCardLoan: (amount: number) => void;
    currentInstallment: number;
    handlePayInstallment: () => void;
    bal: number;
}

const CreditCardModal: React.FC<CreditCardModalProps> = ({
    isOpen, onClose, debt, limit, renegotiationTier, payOffDebt, renegotiate, takeCreditCardLoan, currentInstallment, handlePayInstallment, bal
}) => {
    const [loanAmount, setLoanAmount] = useState<number>(0);
    
    if (!isOpen) return null;

    const availableCredit = limit - debt;
    const installmentDenominator = [24, 48, 60][renegotiationTier];
    const interestRate = [15, 21, 29][renegotiationTier];

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
            setLoanAmount(0);
            onClose();
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
                             <div className="bg-black/20 p-3 rounded-lg mb-2 text-center">
                                <p className="text-sm text-gray-400">Próxima Parcela</p>
                                <p className="text-xl font-bold text-yellow-300">${currentInstallment.toFixed(2)}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Reduzirá a dívida para: 
                                    <span className="font-bold text-white">
                                        ${(debt - currentInstallment).toFixed(2)}
                                    </span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handlePayInstallment} disabled={bal < currentInstallment} className={`${modalBtnClasses} flex-1 bg-yellow-500 text-black hover:bg-yellow-400`}>
                                    Pagar Parcela
                                </button>
                                <button onClick={payOffDebt} disabled={bal < debt} className={`${modalBtnClasses} flex-1 bg-green-500 text-black hover:bg-green-400`}>
                                    Quitar Dívida Total
                                </button>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-yellow-300">Renegociar</h4>
                            <p className="text-sm text-gray-400 mb-2">Altere seu plano de pagamento. Juros maiores para prazos mais longos.</p>
                            <div className="bg-black/20 p-3 rounded-lg space-y-2">
                                <p className="text-center text-sm">Plano Atual: {installmentDenominator}x / {interestRate}% juros</p>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => renegotiate(0)} disabled={renegotiationTier === 0} className={`${modalBtnClasses} w-full bg-sky-500 hover:bg-sky-400`}>
                                        Plano Padrão: 24 Parcelas (15% Juros)
                                    </button>
                                    <button onClick={() => renegotiate(1)} disabled={renegotiationTier === 1} className={`${modalBtnClasses} w-full bg-sky-600 hover:bg-sky-500`}>
                                        Plano Longo: 48 Parcelas (21% Juros)
                                    </button>
                                    <button onClick={() => renegotiate(2)} disabled={renegotiationTier === 2} className={`${modalBtnClasses} w-full bg-sky-700 hover:bg-sky-600`}>
                                        Plano Estendido: 60 Parcelas (29% Juros)
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

// --- PAYMENT DUE MODAL ---
interface PaymentDueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPay: () => void;
    onPostpone: () => void;
    debt: number;
    installmentAmount: number;
}
export const PaymentDueModal: React.FC<PaymentDueModalProps> = ({ isOpen, onClose, onPay, onPostpone, debt, installmentAmount }) => {
    if (!isOpen) return null;
    const modalBtnClasses = "py-3 px-6 font-bold rounded-lg shadow-md transition-colors active:scale-95 disabled:opacity-50";

    return (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 shadow-2xl border-4 border-yellow-500 w-full max-w-md text-white text-center">
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">🗓️ Parcela Vencida!</h3>
                <p className="text-gray-300 mb-2">Sua dívida atual é de <span className="font-bold text-red-400">${debt.toFixed(2)}</span>.</p>
                <p className="text-lg mb-6">Valor da parcela: <span className="font-bold text-yellow-300">${installmentAmount.toFixed(2)}</span></p>
                <div className="flex justify-center gap-4">
                    <button onClick={onPostpone} className={`${modalBtnClasses} bg-red-600 text-white hover:bg-red-500`}>Adiar Parcela</button>
                    <button onClick={onPay} className={`${modalBtnClasses} bg-green-500 text-black hover:bg-green-400`}>Pagar Parcela</button>
                </div>
                 <p className="text-xs text-gray-500 mt-4">Adiar a parcela irá adicionar o valor à sua dívida. Adiar duas vezes seguidas resultará em penalidade.</p>
            </div>
        </div>
    );
};

// --- ITEM PENALTY MODAL ---
interface ItemPenaltyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPay: (items: Partial<Record<SymbolKey, number>>) => void;
    penalty: ItemPenalty | null;
    inventory: Inventory;
}

export const ItemPenaltyModal: React.FC<ItemPenaltyModalProps> = ({ isOpen, onClose, onPay, penalty, inventory }) => {
    const [selection, setSelection] = useState<Partial<Record<SymbolKey, number>>>({});
    if (!isOpen || !penalty) return null;

    // Fix: Explicitly cast the keys of ITEM_PENALTY_VALUES to SymbolKey[] to satisfy handleSelectionChange's parameter type.
    const penaltyItems = (Object.keys(ITEM_PENALTY_VALUES) as SymbolKey[]).filter(key => (inventory[key] || 0) > 0);
    
    const selectedValue = useMemo(() => {
        return (Object.keys(selection) as SymbolKey[]).reduce((acc, key) => {
            const itemKey = key as keyof typeof ITEM_PENALTY_VALUES;
            if (ITEM_PENALTY_VALUES[itemKey]) {
                return acc + (selection[itemKey] || 0) * ITEM_PENALTY_VALUES[itemKey];
            }
            return acc;
        }, 0);
    }, [selection]);

    const handleSelectionChange = (key: SymbolKey, count: number) => {
        const owned = inventory[key] || 0;
        const newCount = Math.max(0, Math.min(owned, count));
        setSelection(prev => ({ ...prev, [key]: newCount }));
    };

    const handlePayClick = () => {
        onPay(selection);
        setSelection({});
    };

    return (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="relative bg-gradient-to-br from-red-900 via-red-800 to-black rounded-2xl p-6 shadow-2xl border-4 border-red-500 w-full max-w-lg text-white">
                 <h3 className="text-2xl font-bold text-red-300 mb-2 text-center">🚨 MULTA POR INADIMPLÊNCIA 🚨</h3>
                 <p className="text-center mb-4">Suas apostas estão bloqueadas. Pague a multa com itens para liberá-las.</p>
                 <div className="bg-black/40 p-3 rounded-lg text-center mb-4">
                    <p>Valor da Multa: <span className="font-bold text-red-400">${penalty.amount.toFixed(2)}</span></p>
                    <p>Valor Selecionado: <span className={`font-bold ${selectedValue >= penalty.amount ? 'text-green-400' : 'text-yellow-400'}`}>${selectedValue.toFixed(2)}</span></p>
                 </div>
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {penaltyItems.length > 0 ? penaltyItems.map(key => (
                        <div key={key} className="grid grid-cols-4 items-center gap-2 bg-black/30 p-2 rounded">
                            <span className="text-2xl font-bold">{key}</span>
                            <span className="text-sm text-gray-400">x{inventory[key]}</span>
                            <input
                                type="number"
                                value={selection[key] || 0}
                                onChange={(e) => handleSelectionChange(key, parseInt(e.target.value) || 0)}
                                min="0"
                                max={inventory[key]}
                                className="w-full bg-gray-900 text-white p-1 rounded border border-gray-600 text-center"
                            />
                             <span className="text-xs text-yellow-400">Valor: ${((selection[key] || 0) * ITEM_PENALTY_VALUES[key as keyof typeof ITEM_PENALTY_VALUES]).toFixed(2)}</span>
                        </div>
                    )) : <p className="text-center text-gray-400">Você não tem itens valiosos para pagar a multa.</p>}
                 </div>
                 <button 
                    onClick={handlePayClick}
                    disabled={selectedValue < penalty.amount}
                    className="w-full mt-4 py-3 px-4 font-bold rounded-lg shadow-md transition-colors active:scale-95 disabled:opacity-50 bg-green-600 text-black hover:bg-green-500 disabled:bg-gray-600">
                    Pagar Multa com Itens
                 </button>
            </div>
        </div>
    );
};


// --- WRAPPER COMPONENT ---
interface CreditCardManagerWrapperProps {
    creditCardLevel: number;
    creditCardDebt: number;
    openCreditCardModal: () => void;
    isCreditCardModalOpen: boolean;
    closeCreditCardModal: () => void;
    creditLimit: number;
    renegotiationTier: RenegotiationTier;
    payOffCreditCardDebt: () => void;
    renegotiateCreditCard: (tier: RenegotiationTier) => void;
    takeCreditCardLoan: (amount: number) => void;
    currentInstallment: number;
    handlePayInstallment: () => void;
    bal: number;
}

const CreditCardManager: React.FC<CreditCardManagerWrapperProps> = (props) => {
    const { 
        creditCardLevel, creditCardDebt, openCreditCardModal, isCreditCardModalOpen,
        closeCreditCardModal, creditLimit, renegotiationTier,
        payOffCreditCardDebt, renegotiateCreditCard, takeCreditCardLoan, currentInstallment,
        handlePayInstallment, bal
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
                payOffDebt={payOffCreditCardDebt}
                renegotiate={renegotiateCreditCard}
                takeCreditCardLoan={takeCreditCardLoan}
                currentInstallment={currentInstallment}
                handlePayInstallment={handlePayInstallment}
                bal={bal}
            />
        </>
    );
}

export default CreditCardManager;
