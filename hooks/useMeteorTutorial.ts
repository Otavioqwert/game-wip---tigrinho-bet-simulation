
import { useEffect, useState } from 'react';

export const useMeteorTutorial = (meteorCount: number) => {
    const [showTutorial, setShowTutorial] = useState(false);
    
    useEffect(() => {
        // Trigger apenas na primeira compra real (count > 0) e se nunca viu antes
        if (meteorCount >= 1) {
            const hasSeen = localStorage.getItem('tigrinho_meteor_tutorial_seen');
            if (!hasSeen) {
                setShowTutorial(true);
            }
        }
    }, [meteorCount]);
    
    const closeTutorial = () => {
        localStorage.setItem('tigrinho_meteor_tutorial_seen', 'true');
        setShowTutorial(false);
    };
    
    return { showTutorial, closeTutorial };
};
