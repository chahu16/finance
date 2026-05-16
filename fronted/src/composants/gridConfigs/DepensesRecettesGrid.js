import {
    safeCurrencyFormatter,
    safeDateFormatter
} from '../config/Config.js';
const dayjs = require('dayjs');

// Libellé du bouton principal
export const addButtonLabelDepensesRecettes = "Ajouter une dépense - recette";

/**
 * ============================================================
 * CONFIGURATION DES COLONNES DU DATAGRID
 * ============================================================
 */
export const getDepensesRecettesColumns = (listeComptes = []) => [
    {
        field: 'compte',
        headerName: 'Compte',
        width: 120,
        editable: true,
        type: 'singleSelect',
        valueOptions: listeComptes,
        isInitialFocus: true, // Focus auto lors de la création
        //validate: (value) => value.length > 0 || "Le nom du compte est obligatoire",
    },
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
            // On s'assure d'avoir la ligne, sinon on renvoie l'existant
            if (!row) return row;

            // Retourne la ligne complète fusionnée
            return {
                ...row,
                dateDepensesRecettes: value,
                // La règle : si une date est mise, chèque en cours devient faux
                chequeEnCours: (value !== null && value !== undefined) ? false : row.chequeEnCours
            };
        },
    },
    {
        field: 'description',
        headerName: 'Description',
        width: 300,
        editable: true,
        isEditFocus: true,
        validate: (value) => value.length > 0 || "Une description est obligatoire",
        isNameField: true,
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
        field: 'noteDeFrais',
        type: 'boolean',
        headerName: 'Note de frais',
        width: 100,
        editable: true
    },
    {
        field: 'notesFraisRemboursee',
        type: 'boolean',
        headerName: 'Note de frais remboursée',
        width: 180,
        editable: true
    },
    {
        field: 'fraisFixe',
        type: 'boolean',
        headerName: 'Frais fixe',
        width: 80,
        editable: true
    },
    {
        field: 'chequeEnCours',
        type: 'boolean',
        headerName: 'Chèques en cours',
        width: 140,
        editable: true
    },
    {
        field: 'depenseRecettesAMasquer',
        type: 'boolean',
        headerName: 'A masquer',
        width: 90,
        editable: true
    },
];

/**
 * ============================================================
 * UTILITAIRES DE FORMATAGE
 * ============================================================
 * Transforme les données brutes de MongoDB (Back-end) 
 * en format exploitable par le DataGrid (Front-end).
 */
export const formatDepensesRecettesBackToFront = (e) => {
    return {
        id: e.id || e._id,
        // Gestion de la provenance du nom du compte selon le retour API
        compte: e.compteNom || e.compte?.nom || e.compte || "",
        dateDepensesRecettes: e.dateDepensesRecettes ? dayjs(e.dateDepensesRecettes).toDate() : null,
        description: e.description ?? "",
        // Conversion des centimes en Euros
        depenses: e.depenses ?? 0,
        recettes: e.recettes ?? 0,
        // Conversion des valeurs en Booléens stricts
        noteDeFrais: !!e.noteDeFrais,
        notesFraisRemboursee: !!e.rembourser,
        fraisFixe: !!e.fraisFixe,
        chequeEnCours: !!e.chequeEnCours,
        depenseRecettesAMasquer: !!e.depenseRecettesAMasquer,
        fraisFixeRef: e.fraisFixeRef ?? null,
        parts: e.parts ?? [50, 50],
        createdAt: e.createdAt ?? null,
    };
};

/**
 * ============================================================
 * MESSAGES D'ALERTE ET TEXTES DYNAMIQUES
 * ============================================================
 */
// Permet de personnaliser le texte (ex: "Supprimer la dépense" vs "la recette")
export const getRowTypeLabeldepensesRecettes = (row, columns) => {
    if (!row) return "la ligne";

    const depenseField = columns.find(col => col.isDepenseColumn)?.field;
    const recetteField = columns.find(col => col.isRecetteColumn)?.field;

    const valDepense = row[depenseField];
    const valRecette = row[recetteField];

    if (valDepense > 0) return <strong>la dépense</strong>;
    if (valRecette > 0) return <strong>la recette</strong>;

    return "la ligne";
};

/**
 * ============================================================
 * LOGIQUE MÉTIER ET VALIDATION
 * ============================================================
 */

// Valide la cohérence des données avant sauvegarde
export const validateRow = (row) => {
    const errors = {};
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const depense = parseFloat(row.depenses) || 0;
    const recette = parseFloat(row.recettes) || 0;

    // Règle 0 : Compte obligatoire
    if (!row.compte || row.compte.trim() === "") {
        errors.compte = "Le compte est obligatoire";
    }

    // Règle 1 : Une ligne doit être soit une dépense, soit une recette (pas les deux, ni rien)
    if (depense === 0 && recette === 0) {
        errors.depenses = "Saisissez soit une dépense, soit une recette";
        errors.recettes = true;
    }
    if (depense > 0 && recette > 0) {
        errors.depenses = "Impossible d'avoir une dépense et une recette en même temps";
        errors.recettes = true;
    }

    // Règle 2 : Si ce n'est pas un chèque en cours ET pas un frais fixe, la date est obligatoire
    if (row.chequeEnCours === false && !row.dateDepensesRecettes && !row.fraisFixe) {
        errors.dateDepensesRecettes = "La date est obligatoire (ou cochez Chèque en cours)";
    }

    // Règle 3 : Interdiction de saisir dans le futur
    if (row.dateDepensesRecettes && new Date(row.dateDepensesRecettes) > today) {
        errors.dateDepensesRecettes = "La date ne peut pas être dans le futur";
    }

    return errors;
};

// Applique des changements automatiques selon les interactions de l'utilisateur
export const applyBusinessRules = (newRow, oldRow) => {
    const updatedRow = { ...newRow };

    // Règle A : Si l'utilisateur saisit une date, on considère que le chèque est encaissé
    const dateHasChanged = newRow.dateDepensesRecettes !== oldRow.dateDepensesRecettes;
    if (dateHasChanged && newRow.dateDepensesRecettes) {
        updatedRow.chequeEnCours = false;
    }

    // Règle B : Si l'utilisateur coche "Chèque en cours", on efface la date (puisqu'il n'est pas encaissé)
    if (updatedRow.chequeEnCours === true && oldRow.chequeEnCours === false) {
        updatedRow.dateDepensesRecettes = null;
    }

    return updatedRow;
};

/**
 * Tri des lignes dépenses/recettes — identique au tri backend
 * 1. Lignes sans date → en haut
 * 2. Dates égales → tri alphabétique par description
 * 3. Tri par date décroissant
 */
export const trierLignesDepensesRecettes = (rows) => {
    return [...rows].sort((a, b) => {
        const dateA = a.dateDepensesRecettes;
        const dateB = b.dateDepensesRecettes;

        // Lignes sans date en haut
        if (!dateA && dateB) return -1;
        if (dateA && !dateB) return 1;

        // Pas de date des 2 côtés → tri alphabétique
        if (!dateA && !dateB) {
            const descA = (a.description || "").trim().toLowerCase();
            const descB = (b.description || "").trim().toLowerCase();
            return descA.localeCompare(descB);
        }

        // Dates égales → tri alphabétique
        if (new Date(dateA).getTime() === new Date(dateB).getTime()) {
            const descA = (a.description || "").trim().toLowerCase();
            const descB = (b.description || "").trim().toLowerCase();
            return descA.localeCompare(descB);
        }

        // Tri par date décroissant
        return new Date(dateB) - new Date(dateA);
    });
};