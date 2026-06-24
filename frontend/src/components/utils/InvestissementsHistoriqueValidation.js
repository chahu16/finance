export const validateRow = (row) => {
    const errors = {};
    const today = new Date(); today.setHours(23, 59, 59, 999);

    if (!row.investissementId) {
        errors.investissementId = "L'investissement est obligatoire";
    }

    if (!row.date) {
        errors.date = 'La date est obligatoire';
    } else {
        const d = row.date instanceof Date ? row.date : new Date(row.date);
        if (isNaN(d.getTime())) {
            errors.date = 'Date invalide';
        } else if (d > today) {
            errors.date = 'La date ne peut pas être dans le futur';
        }
    }

    const valeur = parseFloat(row.valeur);
    if (row.valeur === null || row.valeur === undefined || String(row.valeur).trim() === '') {
        errors.valeur = 'La valeur est obligatoire';
    } else if (isNaN(valeur) || valeur < 0) {
        errors.valeur = 'La valeur doit être positive ou nulle';
    }

    return errors;
};
