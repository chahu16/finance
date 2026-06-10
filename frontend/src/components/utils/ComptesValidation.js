export const validateRow = (row) => {
    const errors = {};

    if (!row.nomCompte || row.nomCompte.trim() === '') {
        errors.nomCompte = 'Le nom du compte est obligatoire';
    }

    // parseFloat retourne toujours un Number ou NaN, jamais null — le ?? 0 serait sans effet
    const seuilOrange = parseFloat(row.seuilOrange);
    if (!isNaN(seuilOrange) && (seuilOrange < 0 || seuilOrange > 100)) {
        errors.seuilOrange = 'Le seuil orange doit être compris entre 0 et 100';
    }

    return errors;
};
