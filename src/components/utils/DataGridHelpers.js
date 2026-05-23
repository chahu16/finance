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

// Règle métier partagée : cocher "Chèque en cours" vide la date, et inversement
export const chequeEnCoursOnFieldChange = ({ field, value, editingId, setEditCellValue }) => {
    if (field === 'chequeEnCours' && value === true) {
        setEditCellValue({ id: editingId, field: 'dateDepensesRecettes', value: null });
    }
    if (field === 'dateDepensesRecettes' && value != null) {
        setEditCellValue({ id: editingId, field: 'chequeEnCours', value: false });
    }
};

// Fabrique un sortComparator pour une colonne date :
// tri par date (nulls en dernier), puis par secondaryField en tiebreaker alphabétique français
export const makeDateSortComparator = (secondaryField) =>
    (v1, v2, p1, p2) => {
        const d1 = v1 ? new Date(v1).getTime() : Infinity;
        const d2 = v2 ? new Date(v2).getTime() : Infinity;
        if (d1 !== d2) return d1 - d2;
        const s1 = (p1.api.getRow(p1.id)?.[secondaryField] ?? '').toLowerCase();
        const s2 = (p2.api.getRow(p2.id)?.[secondaryField] ?? '').toLowerCase();
        const cmp = s1.localeCompare(s2, 'fr');
        const dir = p1.api.getSortModel()[0]?.sort ?? 'asc';
        return dir === 'desc' ? -cmp : cmp;
    };
