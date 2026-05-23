/**
 * Validation métier spécifique au compte joint.
 * Reprend les règles des dépenses/recettes (sans la règle compte, auto-rempli)
 * et ajoute la validation du pourcentage.
 */
export const validateRow = (row) => {
    const errors = {};
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const depense = parseFloat(row.depenses) || 0;
    const recette = parseFloat(row.recettes) || 0;

    // Règle 1 : Description obligatoire
    if (!row.description || row.description.trim() === '') {
        errors.description = 'Une description est obligatoire';
    }

    // Règle 2 : Soit dépense soit recette (pas les deux, ni rien)
    if (depense === 0 && recette === 0) {
        errors.depenses = 'Saisissez soit une dépense, soit une recette';
        errors.recettes = true;
    }
    if (depense > 0 && recette > 0) {
        errors.depenses = "Impossible d'avoir une dépense et une recette en même temps";
        errors.recettes = true;
    }

    // Règle 3 : Date obligatoire si pas chèque en cours ni frais fixe
    if (row.chequeEnCours === false && !row.dateDepensesRecettes && !row.fraisFixe) {
        errors.dateDepensesRecettes = 'La date est obligatoire (ou cochez Chèque en cours)';
    }

    // Règle 4 : Pas de date dans le futur
    if (row.dateDepensesRecettes && new Date(row.dateDepensesRecettes) > today) {
        errors.dateDepensesRecettes = 'La date ne peut pas être dans le futur';
    }

    // Règle 5 : Pourcentage obligatoire, entre 0 et 100
    const pct = parseFloat(row.pourcentageMoi);
    if (row.pourcentageMoi == null || row.pourcentageMoi === '') {
        errors.pourcentageMoi = 'Le pourcentage est obligatoire';
    } else if (isNaN(pct) || pct < 0 || pct > 100) {
        errors.pourcentageMoi = 'Le pourcentage doit être compris entre 0 et 100';
    }

    return errors;
};
