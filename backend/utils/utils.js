/**
 * Convertit proprement une string/number en centimes (entier)
 */
const toCents = (val) => {
    if (typeof val === 'number') return Math.round(val * 100);
    const cleanStr = String(val).replace(',', '.');
    return Math.round(parseFloat(cleanStr) * 100) || 0;
};

module.exports = { toCents };