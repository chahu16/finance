// Focus le bon élément dans une cellule selon son type, après un délai optionnel
export const focusCell = (apiRef, id, field, type, delay = 50) => {
    setTimeout(() => {
        if (!apiRef.current) return;
        const cell = apiRef.current.getCellElement(id, field);
        if (type === 'date') {
            const spinButton = cell?.querySelector('[role="spinbutton"]');
            if (spinButton) spinButton.focus();
        } else {
            const input = cell?.querySelector('input');
            if (input) { input.focus(); input.select(); }
        }
    }, delay);
};

// Construit un message d'erreur lisible à partir des erreurs de colonnes
export const buildErrorMessage = (columns, errors) =>
    columns
        .filter(col => errors[col.field] && typeof errors[col.field] === 'string')
        .map(col => errors[col.field])
        .join(' · ');

// Fusionne les données sauvegardées d'une ligne avec son état d'édition en cours
export const getEditValues = (apiRef, id) => {
    const editRowState = apiRef.current.state.editRows[id];
    const values = { ...(apiRef.current.getRow(id) || {}) };
    if (editRowState) {
        Object.keys(editRowState).forEach(f => { values[f] = editRowState[f].value; });
    }
    return values;
};
