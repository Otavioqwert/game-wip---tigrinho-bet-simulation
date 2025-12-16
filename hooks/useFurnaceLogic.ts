
import React, { useCallback } from 'react';
import type { ActiveCookie, CookieId } from '../types';
import { COOKIE_RECIPES } from '../constants';

interface FurnaceLogicProps {
    sugar: number;
    setSugar: React.Dispatch<React.SetStateAction<number>>;
    activeCookies: ActiveCookie[];
    setActiveCookies: React.Dispatch<React.SetStateAction<ActiveCookie[]>>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
}

export const useFurnaceLogic = (props: FurnaceLogicProps) => {
    const { sugar, setSugar, activeCookies, setActiveCookies, showMsg } = props;

    const craftCookie = useCallback((recipeId: CookieId) => {
        const recipe = COOKIE_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return;

        if (activeCookies.length >= 1) {
            return showMsg("Forno cheio! Apenas 1 cookie por vez.", 2000, true);
        }

        if (sugar < recipe.sugarCost) {
            return showMsg(`Açúcar insuficiente. Requer ${recipe.sugarCost}🍬`, 2000, true);
        }

        setSugar(prev => prev - recipe.sugarCost);

        const newCookie: ActiveCookie = {
            instanceId: Date.now() + Math.random(),
            recipeId: recipe.id,
            name: recipe.name,
            icon: recipe.icon,
            multiplier: recipe.multiplier,
            remainingSpins: recipe.duration,
            maxSpins: recipe.duration
        };

        setActiveCookies(prev => [...prev, newCookie]);
        showMsg(`${recipe.icon} ${recipe.name} assado! Boost de ${recipe.multiplier}x ativado!`, 3000, true);

    }, [sugar, activeCookies, setSugar, setActiveCookies, showMsg]);

    return {
        craftCookie
    };
};
