import { validateDate } from './validators.js';

export const validateRow = (row) => {
    const errors = {};

    if (!row.nom || !String(row.nom).trim()) {
        errors.nom = 'Le nom est obligatoire';
    }

    if (!row.type || !['PEA', 'Assurance vie', 'Immobilier', 'Compte à terme'].includes(row.type)) {
        errors.type = 'Le type est obligatoire';
    }

    const montant = parseFloat(row.montantInvesti);
    if (row.montantInvesti === null || row.montantInvesti === undefined || String(row.montantInvesti).trim() === '') {
        errors.montantInvesti = 'Le versement mensuel est obligatoire';
    } else if (isNaN(montant) || montant < 0) {
        errors.montantInvesti = 'Le versement mensuel doit être positif ou nul';
    }

    if (row.sommeInitiale !== null && row.sommeInitiale !== undefined && String(row.sommeInitiale).trim() !== '') {
        const initiale = parseFloat(row.sommeInitiale);
        if (isNaN(initiale) || initiale < 0) {
            errors.sommeInitiale = 'La somme initiale doit être positive ou nulle';
        }
    }

    const frais = parseFloat(row.tauxFrais);
    if (row.tauxFrais !== null && row.tauxFrais !== undefined && String(row.tauxFrais).trim() !== '') {
        if (isNaN(frais) || frais < 0 || frais > 100) {
            errors.tauxFrais = 'Les frais doivent être entre 0 et 100 %';
        }
    }

    if (row.dateOuverture) {
        const errDate = validateDate(row.dateOuverture);
        if (errDate) errors.dateOuverture = errDate === 'La date est obligatoire'
            ? "Date d'ouverture invalide"
            : errDate;
    }

    if (row.datePremierVersement) {
        const errDate = validateDate(row.datePremierVersement);
        if (errDate) errors.datePremierVersement = errDate === 'La date est obligatoire'
            ? 'Date de 1er versement invalide'
            : errDate;
    }

    return errors;
};
