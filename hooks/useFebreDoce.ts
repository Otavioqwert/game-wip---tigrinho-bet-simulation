
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { RoiSaldo, Inventory, SymbolKey, FeverPackage, PurchasedPackage, FeverContentResult, Multipliers, FeverReport } from '../types';
import { ALL_FEVER_PACKAGES } from '../constants/feverPackages';
import { SYM, INITIAL_INVENTORY, INITIAL_MULTIPLIERS } from '../constants';

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
}

export type FeverPhase = 'IDLE' | 'SETUP' | 'ACTIVE';

export const useFebreDoce = (props: FebreDoceProps) => {
    const { roiSaldo, setRoiSaldo, inv, setInv, mult, setMult, bal, setBal, showMsg } = props;

    const [feverPhase, setFeverPhase] = useState<FeverPhase>('IDLE');
    const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
    const [selectedPackages, setSelectedPackages] = useState<PurchasedPackage[]>([]);
    
    // Fever Active State
    const [febreDocesGiros, setFebreDocesGiros] = useState(0);
    const [betValFebre, setBetValFebre] = useState(10); // Default base bet
    const [initialTotalSpins, setInitialTotalSpins] = useState(0); // Track total spins for report
    
    // Mechanics State
    const [sweetLadderActive, setSweetLadderActive] = useState(false);
    const [sweetLadderD, setSweetLadderD] = useState(0);
    
    // Report State
    const [feverReport, setFeverReport] = useState<FeverReport | null>(null);
    const [startBalance, setStartBalance] = useState(0);
    
    // Backup states
    const originalState = useRef<{ inv: Inventory | null, mult: Multipliers | null }>({ inv: null, mult: null });

    // --- Persistence & Cooldown ---
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

    // --- Setup Logic ---

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
            // REFUND LOGIC: Return money for selected packages
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
        
        // Fallback to last option if rounding errors
        if (!selectedOutcome) {
             const keys = Object.keys(pkg.rolls);
             selectedOutcome = pkg.rolls[keys[keys.length - 1]];
        }

        if (pkg.type === 'bet') {
            return { result: selectedOutcome.spins, desc: `${selectedOutcome.spins} Giros` };
        } else {
            // Check if specific contents are defined (new logic for Aposta Suprema)
            if (selectedOutcome.contents) {
                // Create a description string
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

            // Fallback to value based generation
            return { result: selectedOutcome.value, desc: `Valor $${selectedOutcome.value}` }; 
        }
    };

    const generateItemsFromValue = (value: number, tier: string): FeverContentResult => {
        // Simplified generator based on value
        // Weights favor candies and multipliers
        const result: FeverContentResult = { items: {}, multipliers: {} };
        let remainingValue = value;
        
        // Cost estimations for balancing generation
        const COSTS = { '🍭': 30, '🍦': 50, '🍧': 80, '🍀': 100, '💎': 500, '🐯': 2000, '☄️': 6000 };
        const MULT_COST = 50;

        while (remainingValue > 50) {
            const rand = Math.random();
            if (rand < 0.6) { // Buy Multiplier
                 const syms = Object.keys(COSTS) as SymbolKey[];
                 const s = syms[Math.floor(Math.random() * syms.length)];
                 result.multipliers[s] = (result.multipliers[s] || 0) + 1;
                 remainingValue -= MULT_COST;
            } else { // Buy Item
                // Filter items affordable
                const affordable = (Object.entries(COSTS) as [SymbolKey, number][]).filter(([k, v]) => v <= remainingValue);
                if (affordable.length === 0) break;
                const [s, c] = affordable[Math.floor(Math.random() * affordable.length)];
                result.items[s] = (result.items[s] || 0) + 1;
                remainingValue -= c;
            }
        }
        return result;
    };
    
    // NEW GENERATOR: Completely Random Chest (1-20 items, 1-80x mult)
    // NEW GENERATOR: Baú do Apostador v1.1 (1-20 items, +25% per level for tier symbols)
  const generateRandomChestContents = (): FeverContentResult => {
    const result: FeverContentResult = { items: {}, multipliers: {} };
    const keys = Object.keys(SYM) as SymbolKey[];
    
    // Tier symbols that get +25% per level bonus
    const tierSymbols = ['🐯', '🍀', '💵', '💎'];
    // Sweet items that are NOT affected by multiplier bonus
    const sweetSymbols = ['🍭', '🍦', '🍧'];
    
    // 1 to 20 items
    const quantity = Math.floor(Math.random() * 20) + 1;
    
    for (let i = 0; i < quantity; i++) {
      // Totally random item
      const sym = keys[Math.floor(Math.random() * keys.length)];
      
      // Add Item
      result.items[sym] = (result.items[sym] || 0) + 1;
      
// Apply multiplier levels (1-80 levels for tier symbols, stored as levels not multipliers)
        if (tierSymbols.includes(sym)) {
        // Tier symbols: Adiciona níveis (1-80) para cálculo posterior
        const levels = Math.floor(Math.random() * 80) + 1; // 1-80 níveis
        result.multipliers[sym] = (result.multipliers[sym] || 0) + levels; // Soma os NÍVEIS
      }
 else if (!sweetSymbols.includes(sym)) {        // Other non-sweet items get standard multiplier logic
        const levels = Math.floor(Math.random() * 20) + 1;
        result.multipliers[sym] = (result.multipliers[sym] || 0) + levels;
      }
      // Doces (🍭🍦🍧) são apenas adicionados, sem multiplicadores
    }
    
    return result;
  }

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

        // Process TOTALLY_RANDOM_CHEST (Baú do Apostador)
        if (pkg.contents === 'TOTALLY_RANDOM_CHEST') {
             const generated = generateRandomChestContents();
             purchased.contents = generated;
             // Hiding result
             purchased.resultDescription = `❓ Conteúdo Surpresa`;
        }
        // Process RNG Risk
        else if (pkg.risk === 'risk' && pkg.rolls) {
            const { result, desc, contents } = resolvePackageRoll(pkg);
            // Hiding result for risk packages
            purchased.resultDescription = "❓ Conteúdo Surpresa";
            
            if (pkg.type === 'bet') {
                purchased.spins = result; // Overwrite spins with rolled value
            } else {
                if (contents) {
                    // Use specific contents from the roll (e.g., Aposta Suprema Stars)
                    purchased.contents = contents;
                } else if (typeof result === 'number') {
                    // If item package rolled a VALUE, generate random items from it
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

    }, [bal, selectedPackages, setBal, showMsg]);


    // --- Activation Logic ---

    const startFever = useCallback(() => {
        if (selectedPackages.length === 0) {
            // Allow starting with 0 packages
        }

        // 1. Save state
        originalState.current.inv = { ...inv };
        originalState.current.mult = { ...mult };
        setStartBalance(bal); // Snapshot balance AFTER buying packages

        // 2. Prepare Fever Inventory & Multipliers
        const feverInv = { ...INITIAL_INVENTORY };
        // Zero out everything first to ensure clean slate, except maybe keep wildcard?
        (Object.keys(feverInv) as SymbolKey[]).forEach(k => feverInv[k] = 0);
        feverInv['🍭'] = 5; feverInv['🍦'] = 5; feverInv['🍧'] = 5; // Base starter

        const feverMult = { ...INITIAL_MULTIPLIERS };

        // 3. Process Packages
        let totalSpins = 25; // Base spins
        let activeBet = 10;
        let ladderActive = false;

        const hasApostador = selectedPackages.some(p => p.id === 'pkg_apostador');
        const hasLadder = selectedPackages.some(p => p.id === 'pkg_doce_escada');

        if (hasApostador) {
            activeBet = 100;
        }
        
        if (hasLadder) {
            ladderActive = true;
        }

        selectedPackages.forEach(pkg => {
            if (pkg.id === 'pkg_apostador') return; // Handled separately due to logic order

            if (pkg.type === 'bet') {
                if (typeof pkg.spins === 'number') totalSpins += pkg.spins;
            } else if (pkg.contents && typeof pkg.contents !== 'string') {
                // Add items
                const c = pkg.contents as FeverContentResult;
                if (c.items) {
                    Object.entries(c.items).forEach(([k, v]) => {
                        feverInv[k as SymbolKey] = (feverInv[k as SymbolKey] || 0) + (v as number);
                    });
                }
                // Add multipliers
                if (c.multipliers) {
                    Object.entries(c.multipliers).forEach(([k, v]) => {
                        feverMult[k as SymbolKey] = (feverMult[k as SymbolKey] || 0) + (v as number);
                    });
                }
            }
        });

        // Apply Apostador Reduction AFTER adding all spins
        if (hasApostador) {
            totalSpins = Math.floor(totalSpins / 3);
        }

        // 4. Apply State
        setInv(feverInv);
        setMult(feverMult);
        setFebreDocesGiros(totalSpins);
        setInitialTotalSpins(totalSpins); // Store for report
        setFeverPhase('ACTIVE');
        setBetValFebre(activeBet);
        
        // Reset/Set Ladder State
        setSweetLadderActive(ladderActive);
        setSweetLadderD(0);

        showMsg(hasApostador ? "🔥 FEBRE DO APOSTADOR! (Aposta $100 / Giros reduzidos)" : "🔥 FEBRE DOCE INICIADA! 🔥", 3000, true);

    }, [inv, mult, selectedPackages, setInv, setMult, showMsg, bal]);

    const endFever = useCallback(() => {
        // Calculate report
        const endBalance = bal;
        const report: FeverReport = {
            startBalance: startBalance,
            endBalance: endBalance,
            totalSpins: initialTotalSpins,
            packagesUsed: [...selectedPackages]
        };
        setFeverReport(report);
        
        // Restore State immediately to ensure clean UI behind modal
        if (originalState.current.inv) setInv(originalState.current.inv);
        if (originalState.current.mult) setMult(originalState.current.mult);
        
        originalState.current.inv = null;
        originalState.current.mult = null;

        setFeverPhase('IDLE');
        setFebreDocesGiros(0);
        setSelectedPackages([]);
        setSweetLadderActive(false);
        setSweetLadderD(0);

        // Set Cooldown (30 minutes)
        const end = Date.now() + (30 * 60 * 1000);
        setCooldownEnd(end);
        localStorage.setItem('tigrinho_fever_cooldown', end.toString());
        
        // Show report msg
        // showMsg("Febre Doce terminou! Veja o relatório.", 5000, true);

    }, [setInv, setMult, showMsg, bal, startBalance, initialTotalSpins, selectedPackages]);

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
        sweetLadderActive,
        sweetLadderD,
        setSweetLadderD,
        feverReport,
        closeFeverReport
    };
};
