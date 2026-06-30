// Styles du dialogue de confirmation de suppression
export const deleteDialogSx = {
    '& .MuiDialog-paper': { outline: 'none' },
    '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
};

// Style du champ texte du DatePicker en édition
export const datePickerTextFieldSx = {
    '& .MuiInputBase-input': {
        textAlign: 'center',
        padding: '0px',
    },
};

// Style de la barre d'outils (toolbar)
export const toolbarSx = {
    p: 1,
    display: 'flex',
    gap: 1,
    justifyContent: 'flex-end',
};

export const gridStyle = {
    height: "100%",
    width: "100%",
    "& .MuiDataGrid-columnHeaderTitleContainer": {
        justifyContent: "center",
    },
    "& .actions": { color: "text.secondary" },
    "& .actions .MuiIconButton-root": {
        color: "rgba(0, 0, 0, 0.54)",
    },
    "& .MuiDataGrid-actionsCell .MuiIconButton-root": {
        color: "rgba(0, 0, 0, 0.54)",
    },
    "& .MuiDataGrid-cell--editing:focus-within": {
        backgroundColor: "rgba(2, 136, 209, 0.05) !important",
        boxShadow: "inset 0 0 0 1px #0288d1 !important",
    },
    "& .MuiDataGrid-cell--editing .MuiInputBase-root": {
        backgroundColor: "transparent !important",
        height: "100%",
    },
    // Supprime le trait sous tous les champs en édition
    "& .MuiDataGrid-cell--editing .MuiInputBase-root:before": {
        borderBottom: "none !important",
    },
    "& .MuiDataGrid-cell--editing .MuiInputBase-root:after": {
        borderBottom: "none !important",
    },
    // Supprime la bordure outlined
    "& .MuiOutlinedInput-notchedOutline": {
        border: "none !important",
    },
    // Style cellule en erreur
    "& .cell-error": {
        backgroundColor: "rgba(211, 47, 47, 0.08) !important",
        boxShadow: "inset 0 0 0 1px rgba(211, 47, 47, 0.3) !important",
    },
    // Supprime le trait sous le DatePicker
    "& .MuiPickersInputBase-root:before": {
        borderBottom: "none !important",
    },
    "& .MuiPickersInputBase-root:after": {
        borderBottom: "none !important",
    },
    "& .MuiPickersInputBase-root": {
        borderBottom: "none !important",
    },
    // Cellule en erreur même quand focusée (focus-within a spécificité +1 → on surclasse avec même règle)
    "& .cell-error.MuiDataGrid-cell--editing": {
        backgroundColor: "rgba(211, 47, 47, 0.08) !important",
        boxShadow: "inset 0 0 0 1px rgba(211, 47, 47, 0.3) !important",
    },
    "& .cell-error.MuiDataGrid-cell--editing:focus-within": {
        backgroundColor: "rgba(211, 47, 47, 0.08) !important",
        boxShadow: "inset 0 0 0 1px rgba(211, 47, 47, 0.3) !important",
    },
};
export const addButtonStyle = {
    textTransform: "none",
    fontWeight: 600,
    color: "#000000",
    borderColor: "#000000",
    backgroundColor: "#ffffff",
};

// Même style que addButtonStyle — alias pour la lisibilité des usages
export const importButtonStyle = addButtonStyle;