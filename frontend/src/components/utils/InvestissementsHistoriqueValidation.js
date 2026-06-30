import { validateDate, validateMontantPositifOuNul } from './validators.js';

export const validateRow = (row) => {
    const errors = {};

    if (!row.investissementId) {
        errors.investissementId = "L'investissement est obligatoire";
    }

    const errDate = validateDate(row.date);
    if (errDate) errors.date = errDate;

    const errValeur = validateMontantPositifOuNul(row.valeur);
    if (errValeur) errors.valeur = errValeur;

    return errors;
};
