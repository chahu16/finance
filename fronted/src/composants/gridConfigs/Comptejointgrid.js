import {
    safeCurrencyFormatter,
    safeDateFormatter,
    formateurPourcentage,
    validatePourcentage,
} from '../config/Config.js';

export const addButtonLabelCompteJoint = "Ajouter une dépense - recette";

/**
 * ============================================================
 * CONFIGURATION DES COLONNES DU DATAGRID
 * ============================================================
 */
export const getCompteJointColumns = (personnes = ["Personne 1", "Personne 2"]) => [
    {
        field: 'dateDepensesRecettes',
        align: 'center',
        type: 'date',
        headerName: 'Date',
        width: 130,
        editable: true,
        isCopyFocus: true,
        valueFormatter: safeDateFormatter,
        valueSetter: (value, row) => {
            if (!row) return row;
            return {
                ...row,
                dateDepensesRecettes: value,
                chequeEnCours: (value !== null && value !== undefined) ? false : row.chequeEnCours,
            };
        },
    },
    {
        field: 'description',
        headerName: 'Description',
        width: 300,
        editable: true,
        isInitialFocus: true,
        isEditFocus: true,
        isNameField: true,
        validate: (value) => value.length > 0 || "Une description est obligatoire",
    },
    {
        field: 'depenses',
        type: 'number',
        headerName: 'Dépenses',
        width: 110,
        editable: true,
        align: 'center',
        headerAlign: 'right',
        valueFormatter: safeCurrencyFormatter,
        minValue: 0,
        isDepenseColumn: true,
    },
    {
        field: 'recettes',
        type: 'number',
        headerName: 'Recettes',
        width: 110,
        editable: true,
        align: 'center',
        headerAlign: 'right',
        valueFormatter: safeCurrencyFormatter,
        minValue: 0,
        isRecetteColumn: true,
    },
    {
        field: 'fraisFixe',
        type: 'boolean',
        headerName: 'Frais fixe',
        width: 80,
        editable: true,
    },
    {
        field: 'chequeEnCours',
        type: 'boolean',
        headerName: 'Chèques en cours',
        width: 140,
        editable: true,
    },
    {
        field: 'depenseRecettesAMasquer',
        type: 'boolean',
        headerName: 'A masquer',
        width: 90,
        editable: true,
    },
    {
        field: 'parts_0',
        type: 'number',
        headerName: personnes[0] || "Personne 1",
        width: 120,
        editable: true,
        align: 'center',
        headerAlign: 'center',
        valueFormatter: formateurPourcentage,
        validate: validatePourcentage,
        valueGetter: (value, row) => row.parts?.[0] ?? 50,
        valueSetter: (value, row) => {
            if (value === null || value === undefined || value === "") return { ...row, parts: row.parts ?? [50, 50] };
            const part0 = Math.min(100, Math.max(0, parseFloat(value) || 0));
            return { ...row, parts: [part0, 100 - part0] };
        },
    },
    {
        field: 'parts_1',
        type: 'number',
        headerName: personnes[1] || "Personne 2",
        width: 120,
        editable: false,
        align: 'center',
        headerAlign: 'center',
        valueFormatter: formateurPourcentage,
        valueGetter: (value, row) => row.parts?.[1] ?? 50,
    },
];

/**
 * ============================================================
 * MESSAGES PERSONNALISÉS
 * ============================================================
 */
export const getRowTypeLabelCompteJoint = (row, columns) => {
    if (!row) return "la ligne";
    const depenseField = columns?.find(col => col.isDepenseColumn)?.field;
    const recetteField = columns?.find(col => col.isRecetteColumn)?.field;
    if (row[depenseField] > 0) return <strong>la dépense</strong>;
    if (row[recetteField] > 0) return <strong>la recette</strong>;
    return "la ligne";
};

/**
 * ============================================================
 * VALIDATION
 * ============================================================
 */
export const validateCompteJoint = (row) => {
    const errors = {};
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const depense = parseFloat(row.depenses) || 0;
    const recette = parseFloat(row.recettes) || 0;

    if ((depense === 0 && recette === 0) || (depense > 0 && recette > 0)) {
        errors.depenses = true;
        errors.recettes = true;
    }

    if (row.chequeEnCours === false && !row.dateDepensesRecettes && !row.fraisFixe) {
        errors.chequeEnCours = true;
        errors.dateDepensesRecettes = true;
    }

    if (row.dateDepensesRecettes && new Date(row.dateDepensesRecettes) > today) {
        errors.dateDepensesRecettes = true;
    }

    return errors;
};

/**
 * ============================================================
 * LOGIQUE MÉTIER
 * ============================================================
 */
export const applyCompteJointBusinessRules = (newRow, oldRow) => {
    const updatedRow = { ...newRow };

    // Règle A : Si une date est saisie → chèque en cours devient faux
    const dateHasChanged = newRow.dateDepensesRecettes !== oldRow.dateDepensesRecettes;
    if (dateHasChanged && newRow.dateDepensesRecettes) {
        updatedRow.chequeEnCours = false;
    }

    // Règle B : Si chèque en cours coché → on efface la date
    if (updatedRow.chequeEnCours === true && oldRow.chequeEnCours === false) {
        updatedRow.dateDepensesRecettes = null;
    }

    // Règle C : parts par défaut [50, 50] si non défini
    if (!updatedRow.parts || updatedRow.parts.length < 2) {
        updatedRow.parts = [50, 50];
    }

    return updatedRow;
};