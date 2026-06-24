export const validateRow = (row) => {
    const errors = {};
    const today = new Date(); today.setHours(23, 59, 59, 999);

    if (!row.nom || !String(row.nom).trim()) {
        errors.nom = 'Le nom est obligatoire';
    }

    if (!row.type || !['PEA', 'Assurance vie', 'Immobilier', 'Compte à terme'].includes(row.type)) {
        errors.type = 'Le type est obligatoire';
    }

    const montant = parseFloat(row.montantInvesti);
    if (row.montantInvesti === null || row.montantInvesti === undefined || String(row.montantInvesti).trim() === '') {
        errors.montantInvesti = 'Le montant versé est obligatoire';
    } else if (isNaN(montant) || montant < 0) {
        errors.montantInvesti = 'Le montant doit être positif ou nul';
    }

    const frais = parseFloat(row.tauxFrais);
    if (row.tauxFrais !== null && row.tauxFrais !== undefined && String(row.tauxFrais).trim() !== '') {
        if (isNaN(frais) || frais < 0 || frais > 100) {
            errors.tauxFrais = 'Les frais doivent être entre 0 et 100 %';
        }
    }

    if (row.dateOuverture) {
        const d = row.dateOuverture instanceof Date ? row.dateOuverture : new Date(row.dateOuverture);
        if (isNaN(d.getTime())) {
            errors.dateOuverture = "Date d'ouverture invalide";
        } else if (d > today) {
            errors.dateOuverture = "La date d'ouverture ne peut pas être dans le futur";
        }
    }

    return errors;
};
