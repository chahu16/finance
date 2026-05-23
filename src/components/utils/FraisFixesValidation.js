export const validateRow = (row) => {
    const errors = {};

    if (!row.compte) {
        errors.compte = 'Le compte est obligatoire';
    }

    if (!row.description || !String(row.description).trim()) {
        errors.description = 'La description est obligatoire';
    }

    if (!row.type) {
        errors.type = 'Le type est obligatoire';
    }

    if (!row.periodicite) {
        errors.periodicite = 'La périodicité est obligatoire';
    }

    const montant = parseFloat(row.montant);
    if (row.montant === null || row.montant === undefined || String(row.montant).trim() === '') {
        errors.montant = 'Le montant est obligatoire';
    } else if (isNaN(montant) || montant <= 0) {
        errors.montant = 'Le montant doit être supérieur à 0';
    }

    const isMensuel = row.periodicite === 'Mensuel';
    const jourMax = isMensuel ? 31 : 12;
    const jour = parseInt(row.jourPrelevement, 10);

    if (!row.jourPrelevement || row.jourPrelevement === 0) {
        errors.jourPrelevement = isMensuel
            ? 'Le jour de prélèvement est obligatoire (1-31)'
            : 'Le mois de prélèvement est obligatoire (1-12)';
    } else if (isNaN(jour) || jour < 1 || jour > jourMax) {
        errors.jourPrelevement = isMensuel
            ? 'Le jour doit être compris entre 1 et 31'
            : 'Le mois doit être compris entre 1 et 12';
    }

    return errors;
};
