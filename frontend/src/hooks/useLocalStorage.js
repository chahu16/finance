import { useState, useEffect } from 'react';

export function useLocalStorage(key, defaultValue) {
    const [value, setValue] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved) return JSON.parse(saved);
        } catch {}
        return defaultValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}
