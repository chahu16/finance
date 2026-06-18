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
 * Calcule la dépense réelle (ma poche) pour une note de frais via la description
 * @param {number} montantCents - montant en centimes
 * @param {string} description
 * @param {Object} plafondDoc - Document unique { repas: [...], hotelPDJ: [...], soireeEtape: [...] }
 * @param {Date|string} date
 * @returns {number} montant en centimes
 */
const calculerDepenseReelle = (montantCents, description, plafondDoc, date) => {
    const desc = (description ?? "").toLowerCase();

    let type = null;
    let multiplicateur = 1;

    if (desc.includes('midi - travail') || desc.includes('soir - travail')) {
        type = 'repas';
    } else if (desc.includes('nuits hôtel - travail') || desc.includes('nuit hôtel - travail')) {
        type = 'hotelPDJ';
        const match = desc.match(/(\d+)\s*nuits?/);
        multiplicateur = match ? parseInt(match[1]) : 1;
    } else if (desc.includes('soirée étape - travail') || desc.includes('soiree etape - travail')) {
        type = 'soireeEtape';
        const match = desc.match(/(\d+)\s*soirées?|soirees?/);
        multiplicateur = match ? parseInt(match[1]) : 1;
    }

    if (!type) return montantCents;

    const plafond = getPlafondActif(plafondDoc, type, date);
    if (!plafond) return montantCents;

    return Math.max(0, montantCents - plafond.montantMax * multiplicateur);
};

/**
 * Calcule le dépassement (dépense de ma poche) pour une note de frais via le nom de sous-catégorie.
 * @param {number} montantCents - montant en centimes
 * @param {string} catNom - nom de la sous-catégorie (ex : "midi", "soir", "hôtel + pdj")
 * @param {Object} plafondDoc - Document unique { repas: [...], hotelPDJ: [...], soireeEtape: [...] }
 * @param {Date|string} date
 * @returns {number|null} dépassement en centimes, ou null si aucun plafond applicable
 */
const calculerDepenseReelleParCategorie = (montantCents, catNom, plafondDoc, date) => {
    if (!plafondDoc || !catNom) return null;
    const nom = catNom.toLowerCase();

    let type = null;
    if (nom.includes('étape') || nom.includes('etape')) {
        type = 'soireeEtape';
    } else if (nom.includes('hôtel') || nom.includes('hotel')) {
        type = 'hotelPDJ';
    } else if (nom.includes('midi') || nom.includes('soir')) {
        type = 'repas';
    }

    if (!type) return null;

    const plafond = getPlafondActif(plafondDoc, type, date);
    if (!plafond) return null;

    return Math.max(0, montantCents - plafond.montantMax);
};

module.exports = { getPlafondActif, calculerDepenseReelle, calculerDepenseReelleParCategorie };