import { useState, useEffect } from 'react';

const makeKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function useTodayKey() {
    const [todayKey, setTodayKey] = useState(makeKey);

    useEffect(() => {
        const idRef = { current: null };
        const scheduleNextMidnight = () => {
            const now = new Date();
            const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            idRef.current = setTimeout(() => {
                setTodayKey(makeKey());
                scheduleNextMidnight();
            }, midnight - now);
        };
        scheduleNextMidnight();
        return () => clearTimeout(idRef.current);
    }, []);

    return todayKey;
}
