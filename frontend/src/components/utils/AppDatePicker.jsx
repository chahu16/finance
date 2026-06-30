import { useMemo, useRef, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';

/**
 * DatePicker préconfigurée pour les formulaires libres (hors DataGrid).
 * Comportement identique à GridEditDateCell :
 *   - maxDate = aujourd'hui (bloque les dates futures)
 *   - Locale fr, actions today / clear / cancel
 *   - Échap sur le champ texte : 1er Échap vide la date, 2e appelle onCancel
 *   - Enter → onSave, Tab → onTabNext, Shift+Tab → onTabPrev
 */
export function AppDatePicker({
    value,
    onChange,
    onSave,
    onCancel,
    onTabNext,
    onTabPrev,
    error,
    helperText,
    inputRef,
    autoFocus = false,
    size = 'small',
    fullWidth = true,
    disabled = false,
    slotProps: externalSlotProps,
    ...props
}) {
    const maxDate = useMemo(() => {
        const d = new Date(); d.setHours(23, 59, 59, 999); return d;
    }, []);

    const containerRef = useRef(null);
    const valueRef = useRef(value);
    valueRef.current = value;

    // Gestion Échap : 1er → vide, 2e → annule
    // Capture sur le container pour intercepter avant MUI DatePicker (portail calendrier)
    useEffect(() => {
        const onEscape = (e) => {
            if (e.key !== 'Escape') return;
            if (!containerRef.current?.contains(document.activeElement)) return;
            e.stopPropagation();
            e.preventDefault();
            if (valueRef.current !== null && valueRef.current !== undefined && valueRef.current !== '') {
                onChange(null);
            } else {
                onCancel?.();
            }
        };
        document.addEventListener('keydown', onEscape, true);
        return () => document.removeEventListener('keydown', onEscape, true);
    }, [onChange, onCancel]);

    return (
        <div ref={containerRef} style={fullWidth ? { width: '100%' } : undefined}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                    value={value ?? null}
                    onChange={onChange}
                    maxDate={maxDate}
                    disabled={disabled}
                    localeText={{ todayButtonLabel: "Aujourd'hui", clearButtonLabel: 'Effacer', cancelButtonLabel: 'Annuler' }}
                    slotProps={{
                        actionBar: { actions: ['today', 'clear', 'cancel'] },
                        ...externalSlotProps,
                        textField: {
                            size,
                            fullWidth,
                            autoFocus,
                            error: !!error,
                            helperText,
                            inputRef,
                            onKeyDown: e => {
                                if (e.key === 'Enter') { e.preventDefault(); onSave?.(); }
                                if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); onTabNext?.(); }
                                if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); onTabPrev?.(); }
                            },
                            ...externalSlotProps?.textField,
                            // Fond rouge léger sur erreur — MUI X DatePicker utilise MuiPickersInputBase-root/MuiPickersOutlinedInput-root
                            // (pas MuiInputBase-root comme les TextField standards)
                            sx: {
                                ...(error ? {
                                    '& .MuiInputBase-root, & .MuiPickersInputBase-root, & .MuiPickersOutlinedInput-root': {
                                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                                    },
                                } : {}),
                                ...(externalSlotProps?.textField?.sx || {}),
                            },
                        },
                    }}
                    {...props}
                />
            </LocalizationProvider>
        </div>
    );
}
