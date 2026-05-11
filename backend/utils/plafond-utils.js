/**
 * Retourne le plafond actif pour un type et une date donnée
 * @param {Object} plafondDoc - Document unique { midi: [...], hotel: [...] }
 * @param {'midi'|'hotel'} type
 * @param {Date|string} date
 */
const getPlafondActif = (plafondDoc, type, date) => {
    if (!plafondDoc || !plafondDoc[type]) return null;
    const entrees = plafondDoc[type]
        .filter(e => new Date(e.dateEffet) <= new Date(date))
        .sort((a, b) => new Date(b.dateEffet) - new Date(a.dateEffet));
    return entrees[0] ?? null;
};

/**
 * Calcule la dépense réelle (ma poche) pour une note de frais
 * @param {number} montantCents - montant en centimes
 * @param {string} description
 * @param {Object} plafondDoc - Document unique { midi: [...], hotel: [...] }
 * @param {Date|string} date
 * @returns {number} montant en centimes
 */
const calculerDepenseReelle = (montantCents, description, plafondDoc, date) => {
    const desc = (description ?? "").toLowerCase();

    let type = null;
    let multiplicateur = 1;

    if (desc.includes('midi - travail') || desc.includes('soir - travail')) {
        // Repas midi ou soir — même plafond
        type = 'repas';
    } else if (desc.includes('nuits hôtel - travail') || desc.includes('nuit hôtel - travail')) {
        // Hôtel + petit déjeuner
        type = 'hotelPDJ';
        const match = desc.match(/(\d+)\s*nuits?/);
        multiplicateur = match ? parseInt(match[1]) : 1;
    } else if (desc.includes('soirée étape - travail') || desc.includes('soiree etape - travail')) {
        // Soirée étape
        type = 'soireeEtape';
        const match = desc.match(/(\d+)\s*soirées?|soirees?/);
        multiplicateur = match ? parseInt(match[1]) : 1;
    }

    if (!type) return montantCents;

    const plafond = getPlafondActif(plafondDoc, type, date);
    if (!plafond) return montantCents;

    const plafondCents = plafond.montantMax * 100 * multiplicateur;
    return Math.max(0, montantCents - plafondCents);
};

module.exports = { getPlafondActif, calculerDepenseReelle };