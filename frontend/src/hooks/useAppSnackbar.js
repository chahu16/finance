import { useState, useCallback } from 'react';

export function useAppSnackbar() {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success', key: 0 });

    // key incrémental → force le remontage de <Snackbar> → reset du timer autoHideDuration
    const show = useCallback((message, severity = 'success') => {
        setSnackbar(prev => ({ open: true, message, severity, key: prev.key + 1 }));
    }, []);

    const handleClose = useCallback((_, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    return { snackbar, show, handleClose };
}
