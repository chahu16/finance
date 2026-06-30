export function validateDate(value) {
    if (!value) return 'La date est obligatoire';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return 'Date invalide';
    const today = new Date(); today.setHours(23, 59, 59, 999);
    if (d > today) return 'La date ne peut pas être dans le futur';
    return null;
}

export function validateMontantPositif(value) {
    if (value === '' || value == null || String(value).trim() === '') return 'Le montant est obligatoire';
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return 'Le montant doit être supérieur à 0';
    return null;
}

export function validateMontantPositifOuNul(value) {
    if (value === '' || value == null || String(value).trim() === '') return 'La valeur est obligatoire';
    const v = parseFloat(value);
    if (isNaN(v) || v < 0) return 'La valeur doit être positive ou nulle';
    return null;
}
