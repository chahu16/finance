import { validateDate } from './validators.js';

export const validateRow = (row) => {
    const errors = {};

    if (!row.compte || row.compte.trim() === '') {
        errors.compte = 'Le compte est obligatoire';
    }

    if (!row.description || row.description.trim() === '') {
        errors.description = 'Une description est obligatoire';
    }

    const depense = parseFloat(row.depenses) || 0;
    const recette = parseFloat(row.recettes) || 0;

    if (depense === 0 && recette === 0) {
        errors.depenses = 'Saisissez soit une dépense, soit une recette';
        errors.recettes = 'Saisissez soit une dépense, soit une recette';
    }
    if (depense > 0 && recette > 0) {
        errors.depenses = "Impossible d'avoir une dépense et une recette en même temps";
        errors.recettes = "Impossible d'avoir une dépense et une recette en même temps";
    }

    if (row.chequeEnCours === false && !row.fraisFixe) {
        const errDate = validateDate(row.dateDepensesRecettes);
        if (errDate) errors.dateDepensesRecettes = errDate === 'La date est obligatoire'
            ? 'La date est obligatoire (ou cochez Chèque en cours)'
            : errDate;
    }

    return errors;
};
