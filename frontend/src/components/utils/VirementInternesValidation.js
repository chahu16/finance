import { validateDate, validateMontantPositif } from './validators.js';

export const validateRow = (row) => {
    const errors = {};

    const errMontant = validateMontantPositif(row.montant);
    if (errMontant) errors.montant = errMontant;

    const hasSource = !!row.compteSource;
    const hasDest   = !!row.compteDestination;

    if (!hasSource && !hasDest) {
        errors.compteSource      = 'Le compte source est obligatoire';
        errors.compteDestination = 'Le compte destination est obligatoire';
    } else if (hasSource && !hasDest) {
        errors.compteDestination = 'Le compte destination est obligatoire';
    } else if (!hasSource && hasDest) {
        errors.compteSource = 'Le compte source est obligatoire';
    } else if (row.compteSource === row.compteDestination) {
        errors.compteSource      = 'Le compte source et le compte destination doivent être différents';
        errors.compteDestination = true;
    }

    const errDate = validateDate(row.dateVirement);
    if (errDate) errors.dateVirement = errDate;

    return errors;
};
