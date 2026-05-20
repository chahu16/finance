export const validateRow = (row) => {
    const errors = {};

    if (!row.nomCompte || row.nomCompte.trim() === '') {
        errors.nomCompte = 'Le nom du compte est obligatoire';
    }

    const seuilOrange = parseFloat(row.seuilOrange) ?? 0;
    if (seuilOrange < 0 || seuilOrange > 100) {
        errors.seuilOrange = 'Le seuil orange doit être compris entre 0 et 100';
    }

    return errors;
};
