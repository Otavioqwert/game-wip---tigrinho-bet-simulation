import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { RoiSaldo, Inventory, SymbolKey, FeverPackage, PurchasedPackage, FeverContentResult, Multipliers, FeverReport, MidSymbolKey } from '../types';
import { ALL_FEVER_PACKAGES } from '../constants/feverPackages';
import { SYM, INITIAL_INVENTORY, INITIAL_MULTIPLIERS, MID, SUGAR_CONVERSION } from '../constants';
import { useSweetLadder } from './useSweetLadder';
import { createFeverSnapshot, restoreFromSnapshot, EMPTY_FEVER_SNAPSHOT, type FeverSnapshot } from '../utils/feverStateIsolation';
import type { useParaisoDoceDetector } from './useParaisoDoceDetector';

interface FebreDoceProps {
    roiSaldo: RoiSaldo;
    setRoiSaldo: React.Dispatch<React.SetStateAction<RoiSaldo>>;
    inv: Inventory;
    setInv: React.Dispatch<React.SetStateAction<Inventory>>;
    mult: Multipliers;
    setMult: React.Dispatch<React.SetStateAction<Multipliers>>;
    bal: number;
    setBal: React.Dispatch<React.SetStateAction<number>>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    feverSnapshot: FeverSnapshot;
    setFeverSnapshot: (snapshot: FeverSnapshot) => void;
    paraisoDetector: ReturnType<typeof useParaisoDoceDetector>;
}

export type FeverPhase = 'IDLE' | 'SETUP' | 'ACTIVE';

export const useFebreDoce = (props: FebreDoceProps) => {
    const { roiSaldo, setRoiSaldo, inv, setInv, mult, setMult, bal, setBal, showMsg, feverSnapshot, setFeverSnapshot, paraisoDetector } = props;

    const [feverPhase, setFeverPhase] = useState<FeverPhase>('IDLE');
    const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
    const [selectedPackages, setSelectedPackages] = useState<PurchasedPackage[]>([]);
    
    const [febreDocesGiros, setFebreDocesGiros] = useState(0);
    const [betValFebre, setBetValFebre] = useState(10);
    const [initialTotalSpins, setInitialTotalSpins] = useState(0);
    
    const sweetLadder = useSweetLadder();
    
    const [feverReport, setFeverReport] = useState<FeverReport | null>(null);
    const [startBalance, setStartBalance] = useState(0);

    useEffect(() => {
        const savedCooldown = localStorage.getItem('tigrinho_fever_cooldown');
        if (savedCooldown) {
            const end = parseInt(savedCooldown, 10);
            if (Date.now() < end) {
                setCooldownEnd(end);
            } else {
                localStorage.removeItem('tigrinho_fever_cooldown');
            }
        }
    }, []);

    const openFeverSetup = useCallback(() => {
        if (feverPhase !== 'IDLE') return;
        if (cooldownEnd && Date.now() < cooldownEnd) {
            const minutesLeft = Math.ceil((cooldownEnd - Date.now()) / 60000);
            showMsg(`Febre Doce em recarga! Volte em ${minutesLeft} minutos.`, 3000, true);
            return;
        }
        setFeverPhase('SETUP');
        setSelectedPackages([]);
    }, [feverPhase, cooldownEnd, showMsg]);

    const closeFeverSetup = useCallback(() => {
        if (feverPhase === 'SETUP') {
            if (selectedPackages.length > 0) {
                const totalRefund = selectedPackages.reduce((acc, p) => acc + p.cost, 0);
                setBal(b => b + totalRefund);
                showMsg(`Cancelado: $${totalRefund.toLocaleString()} reembolsados!`, 3000, true);
            }
            
            setSelectedPackages([]);
            setFeverPhase('IDLE');
        }
    }, [feverPhase, selectedPackages, setBal, showMsg]);

    const resolvePackageRoll = (pkg: FeverPackage): { result: any, desc: string, contents?: FeverContentResult } => {
        if (!pkg.rolls) return { result: null, desc: '' };

        const rand = Math.random();
        let accumulated = 0;
        let selectedOutcome = null;

        for (const [key, outcome] of Object.entries(pkg.rolls)) {
            accumulated += outcome.chance;
            if (rand <= accumulated) {
                selectedOutcome = outcome;
                break;
            }
        }
        
        if (!selectedOutcome) {
             const keys = Object.keys(pkg.rolls);
             selectedOutcome = pkg.rolls[keys[keys.length - 1]];
        }

        if (pkg.type === 'bet') {
            return { result: selectedOutcome.spins, desc: `${selectedOutcome.spins} Giros` };
        } else {
            if (selectedOutcome.contents) {
                let parts: string[] = [];
                if (selectedOutcome.contents.items) {
                    Object.entries(selectedOutcome.contents.items).forEach(([k, v]) => parts.push(`${v}x ${k}`));
                }
                if (selectedOutcome.contents.multipliers) {
                    Object.entries(selectedOutcome.contents.multipliers).forEach(([k, v]) => parts.push(`${v}x Mult ${k}`));
                }
                const desc = parts.join(', ') || 'Conteúdo Especial';
                return { result: null, desc, contents: selectedOutcome.contents };
            }

            return { result: selectedOutcome.value, desc: `Valor $${selectedOutcome.value}` }; 
        }
    };

    const generateItemsFromValue = (value: number, tier: string): FeverContentResult => {
        const result: FeverContentResult = { items: {}, multipliers: {} };
        let remainingValue = value;
        
        const COSTS = { '🍭': 30, '🍦': 50, '🍧': 80, '🍀': 100, '💎': 500, '🐯': 2000, '☄️': 6000 };
        const MULT_COST = 50;

        while (remainingValue > 50) {
            const rand = Math.random();
            if (rand < 0.6) {
                 const syms = Object.keys(COSTS) as SymbolKey[];
                 const s = syms[Math.floor(Math.random() * syms.length)];
                 result.multipliers[s] = (result.multipliers[s] || 0) + 1;
                 remainingValue -= MULT_COST;
            } else {
                const affordable = (Object.entries(COSTS) as [SymbolKey, number][]).filter(([k, v]) => v <= remainingValue);
                if (affordable.length === 0) break;
                const [s, c] = affordable[Math.floor(Math.random() * affordable.length)];
                result.items[s] = (result.items[s] || 0) + 1;
                remainingValue -= c;
            }
        }
        return result;
    };
    
  const generateRandomChestContents = (): FeverContentResult => {
    const result: FeverContentResult = { items: {}, multipliers: {} };
    const keys = Object.keys(SYM) as SymbolKey[];
    
    const tierSymbols = ['🐯', '🍀', '💵', '💎'];
    const sweetSymbols = ['🍭', '🍦', '🍧'];
    
    const quantity = Math.floor(Math.random() * 20) + 1;
    
    for (let i = 0; i < quantity; i++) {
      const sym = keys[Math.floor(Math.random() * keys.length)];
      
      result.items[sym] = (result.items[sym] || 0) + 1;
      
      if (tierSymbols.includes(sym)) {
        const levels = Math.floor(Math.random() * 80) + 1;
        result.multipliers[sym] = (result.multipliers[sym] || 0) + levels;
      } else if (!sweetSymbols.includes(sym)) {
        const levels = Math.floor(Math.random() * 20) + 1;
        result.multipliers[sym] = (result.multipliers[sym] || 0) + levels;
      }
    }
    
    return result;
  };

    const buyPackage = useCallback((pkg: FeverPackage) => {
        if (selectedPackages.length >= 3) {
            return showMsg("Máximo de 3 pacotes por febre!", 2000, true);
        }
        if (selectedPackages.some(p => p.id === pkg.id)) {
            return showMsg("Você já comprou este pacote!", 2000, true);
        }
        if (bal < pkg.cost) {
            return showMsg("Saldo insuficiente!", 2000, true);
        }

        setBal(b => b - pkg.cost);

        let purchased: PurchasedPackage = { ...pkg, uniqueId: `${pkg.id}_${Date.now()}` };

        // 🍬 ATIVA DETECTOR se comprar Paraíso Doce (ID CORRETO: safe_mid_1)
        if (pkg.id === 'safe_mid_1') {
            paraisoDetector.activate();
            showMsg("🍬 Paraíso Doce ativado! Sistema de detecção ligado!", 3000, true);
        }

        if (pkg.contents === 'TOTALLY_RANDOM_CHEST') {
             const generated = generateRandomChestContents();
             purchased.contents = generated;
             purchased.resultDescription = `❓ Conteúdo Surpresa`;
        }
        else if (pkg.risk === 'risk' && pkg.rolls) {
            const { result, desc, contents } = resolvePackageRoll(pkg);
            purchased.resultDescription = "❓ Conteúdo Surpresa";
            
            if (pkg.type === 'bet') {
                purchased.spins = result;
            } else {
                if (contents) {
                    purchased.contents = contents;
                } else if (typeof result === 'number') {
                    const generated = generateItemsFromValue(result, pkg.tier);
                    purchased.contents = generated;
                }
            }
        } else if (pkg.type === 'bet') {
            purchased.resultDescription = pkg.spins ? `${pkg.spins} Giros` : 'Efeito Especial';
        } else {
            purchased.resultDescription = "Itens Definidos";
        }

        setSelectedPackages(prev => [...prev, purchased]);
        showMsg(`${pkg.name} adquirido!`, 1500, true);

    }, [bal, selectedPackages, setBal, showMsg, paraisoDetector]);


    const startFever = useCallback(() => {
        if (selectedPackages.length === 0) {}

        setStartBalance(bal);

        const feverInv = { ...INITIAL_INVENTORY };
        (Object.keys(feverInv) as SymbolKey[]).forEach(k => feverInv[k] = 0);
        feverInv['🍭'] = 5; feverInv['🍦'] = 5; feverInv['🍧'] = 5;

        const feverMult = { ...INITIAL_MULTIPLIERS };

        let totalSpins = 25;
        let activeBet = 10;
        let ladderActive = false;

        const hasApostador = selectedPackages.some(p => p.id === 'pkg_apostador');
        const hasLadder = selectedPackages.some(p => p.id === 'pkg_doce_escada');

        if (hasApostador) {
            activeBet = 100;
        }
        
        if (hasLadder) {
            ladderActive = true;
            feverInv['🍭'] += 5;
            feverInv['🍦'] += 5;
            feverInv['🍧'] += 5;
        }

        selectedPackages.forEach(pkg => {
            if (pkg.id === 'pkg_apostador') return;

            if (pkg.type === 'bet') {
                if (typeof pkg.spins === 'number') totalSpins += pkg.spins;
            } else if (pkg.contents && typeof pkg.contents !== 'string') {
                const c = pkg.contents as FeverContentResult;
                if (c.items) {
                    Object.entries(c.items).forEach(([k, v]) => {
                        feverInv[k as SymbolKey] = (feverInv[k as SymbolKey] || 0) + (v as number);
                    });
                }
                if (c.multipliers) {
                    Object.entries(c.multipliers).forEach(([k, v]) => {
                        feverMult[k as SymbolKey] = (feverMult[k as SymbolKey] || 0) + (v as number);
                    });
                }
            }
        });

        if (hasApostador) {
            totalSpins = Math.floor(totalSpins / 4);
        }

        const snapshot = createFeverSnapshot(inv, mult, feverInv, feverMult);
        setFeverSnapshot(snapshot);

        setInv(feverInv);
        setMult(feverMult);
        setFebreDocesGiros(totalSpins);
        setInitialTotalSpins(totalSpins);
        setFeverPhase('ACTIVE');
        setBetValFebre(activeBet);
        
        if (ladderActive) {
            sweetLadder.activateMechanic();
        }

        showMsg(hasApostador ? "🔥 FEBRE DO APOSTADOR! (Aposta $100 / Giros reduzidos)" : "🔥 FEBRE DOCE INICIADA! 🔥", 3000, true);

    }, [inv, mult, selectedPackages, setInv, setMult, showMsg, bal, sweetLadder, setFeverSnapshot]);

    const endFever = useCallback(() => {
        const endBalance = bal;
        const report: FeverReport = {
            startBalance: startBalance,
            endBalance: endBalance,
            totalSpins: initialTotalSpins,
            packagesUsed: [...selectedPackages]
        };
        setFeverReport(report);
        
        const restored = restoreFromSnapshot(feverSnapshot);
        if (restored) {
            setInv(restored.inv);
            setMult(restored.mult);
        }
        
        setFeverSnapshot(EMPTY_FEVER_SNAPSHOT);

        setFeverPhase('IDLE');
        setFebreDocesGiros(0);
        setSelectedPackages([]);
        
        // 🍬 DESATIVA DETECTOR
        paraisoDetector.deactivate();
        
        sweetLadder.deactivateMechanic();

        const end = Date.now() + (30 * 60 * 1000);
        setCooldownEnd(end);
        localStorage.setItem('tigrinho_fever_cooldown', end.toString());

    }, [setInv, setMult, showMsg, bal, startBalance, initialTotalSpins, selectedPackages, sweetLadder, feverSnapshot, setFeverSnapshot, paraisoDetector]);

    const closeFeverReport = useCallback(() => {
        setFeverReport(null);
    }, []);

    return {
        feverPhase,
        openFeverSetup,
        closeFeverSetup,
        buyPackage,
        startFever,
        endFever,
        selectedPackages,
        febreDocesGiros,
        setFebreDocesGiros,
        betValFebre,
        cooldownEnd,
        
        sweetLadder,
        
        feverReport,
        closeFeverReport
    };
};
