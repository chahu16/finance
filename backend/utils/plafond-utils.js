/**
 * Retourne le plafond actif pour un type et une date donnée
 */
const getPlafondActif = (plafonds, type, date) => {
    const plafondsFiltres = plafonds
        .filter(p => p.type === type && new Date(p.dateEffet) <= new Date(date))
        .sort((a, b) => new Date(b.dateEffet) - new Date(a.dateEffet));
    return plafondsFiltres[0] ?? null;
};

/**
 * Calcule la dépense réelle (ma poche) pour une note de frais
 * @returns montant en centimes
 */
const calculerDepenseReelle = (montantCents, description, plafonds, date) => {
    const desc = (description ?? "").toLowerCase();

    let type = null;
    let multiplicateur = 1;

    if (desc.includes('midi - travail')) {
        type = 'midi';
    } else if (desc.includes('nuits - travail') || desc.includes('nuit - travail')) {
        type = 'hotel';
        const match = desc.match(/(\d+)\s*nuits?/);
        multiplicateur = match ? parseInt(match[1]) : 1;
    }

    if (!type) return montantCents;

    const plafond = getPlafondActif(plafonds, type, date);
    if (!plafond) return montantCents;

    const plafondCents = plafond.montantMax * multiplicateur;
    return Math.max(0, montantCents - plafondCents);
};

module.exports = { getPlafondActif, calculerDepenseReelle };