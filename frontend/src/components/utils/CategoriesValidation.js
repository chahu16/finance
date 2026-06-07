export const validateRow = (row) => {
    const errors = {};
    if (!row.groupe || !String(row.groupe).trim()) {
        errors.groupe = 'La catégorie est obligatoire';
    }
    if (!row.nom || !String(row.nom).trim()) {
        errors.nom = 'La sous-catégorie est obligatoire';
    }
    if (!row.type) {
        errors.type = 'Le type est obligatoire';
    }
    return errors;
};
