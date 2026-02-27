import { useState, useEffect, useCallback } from 'react';
import {
    ENVELOPE_CARD_CHANCES,
    ENVELOPE_COOLDOWN_MS,
    ENVELOPE_QTY_TABLE,
    SCRATCH_CARD_TIERS_V3,
} from '../constants';
import type { ScratchCardInventory, EnvelopeState } from '../types';

interface EnvelopeLogicProps {
    scratchCardInventory: ScratchCardInventory;
    setScratchCardInventory: React.Dispatch<React.SetStateAction<ScratchCardInventory>>;
    envelopeState: EnvelopeState;
    setEnvelopeState: React.Dispatch<React.SetStateAction<EnvelopeState>>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
}

export const useEnvelopeLogic = (props: EnvelopeLogicProps) => {
    const {
        scratchCardInventory,
        setScratchCardInventory,
        envelopeState,
        setEnvelopeState,
        showMsg,
    } = props;

    const [cooldownRemaining, setCooldownRemaining] = useState(0);

    // ── tick do cooldown ────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            setCooldownRemaining(
                Math.max(0, ENVELOPE_COOLDOWN_MS - (Date.now() - envelopeState.lastOpenTime))
            );
        }, 500);
        return () => clearInterval(interval);
    }, [envelopeState.lastOpenTime]);

    // ── helper de formatação ────────────────────────────────────
    const fmtCooldown = (ms: number): string => {
        if (ms <= 0) return 'Pronto!';
        const s = Math.ceil(ms / 1000);
        if (s < 60) return `${s}s`;
        return `${Math.floor(s / 60)}m ${s % 60}s`;
    };

    // ── abre envelope ─────────────────────────────────────────
    const openEnvelope = useCallback(() => {
        const rem = Math.max(0, ENVELOPE_COOLDOWN_MS - (Date.now() - envelopeState.lastOpenTime));
        if (rem > 0) {
            showMsg(`⏳ Próximo envelope em ${fmtCooldown(rem)}`, 1500, true);
            return;
        }

        // sorteia quantidade de cartas (1–4)
        const rollQty = Math.random();
        let acc = 0, qty = 1;
        for (const entry of ENVELOPE_QTY_TABLE) {
            acc += entry.prob;
            if (rollQty < acc) { qty = entry.qty; break; }
        }

        // cada slot rola todos os tiers de forma independente
        // a ordem é do mais raro ao mais comum para priorizar tiers altos
        // quando mais de um tier passar no mesmo slot, pega o primeiro
        const gained: number[] = Array(SCRATCH_CARD_TIERS_V3.length).fill(0);
        const tiersOrdered = SCRATCH_CARD_TIERS_V3
            .map((_, i) => i)
            .sort((a, b) => ENVELOPE_CARD_CHANCES[a] - ENVELOPE_CARD_CHANCES[b]); // raro primeiro

        for (let slot = 0; slot < qty; slot++) {
            for (const tier of tiersOrdered) {
                if (Math.random() < ENVELOPE_CARD_CHANCES[tier]) {
                    gained[tier]++;
                    break;
                }
            }
        }

        setScratchCardInventory(prev =>
            prev.map((count, tier) => count + gained[tier])
        );

        setEnvelopeState(prev => ({
            lastOpenTime: Date.now(),
            totalOpened: prev.totalOpened + 1,
        }));

        const resumo = gained
            .map((n, t) =>
                n > 0
                    ? `${SCRATCH_CARD_TIERS_V3[t].theme.icon} ${SCRATCH_CARD_TIERS_V3[t].name}${n > 1 ? ` x${n}` : ''}`
                    : ''
            )
            .filter(Boolean)
            .join(', ');

        showMsg(
            resumo
                ? `📬 Envelope: ${resumo}!`
                : `📬 Envelope aberto — nada desta vez.`,
            4000,
            true
        );
    }, [envelopeState.lastOpenTime, setScratchCardInventory, setEnvelopeState, showMsg]);

    return {
        openEnvelope,
        cooldownRemaining,
        fmtCooldown,
    };
};
