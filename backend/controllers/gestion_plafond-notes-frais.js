const plafond = require('../models/plafond-notes-frais.js');
const { toCents } = require('../utils/utils.js');

/**
 * Retourne le document unique (ou le crée s'il n'existe pas encore)
 */
const getOuCreerDoc = async () => {
    let doc = await plafond.findOne();
    if (!doc) {
        doc = await new plafond({ midi: [], hotel: [] }).save();
    }
    return doc;
};

/**
 * Formate le document unique pour le front
 * Retourne { midi: [...], hotel: [...] }
 */
const formaterPourFront = (doc) => {
    const item = doc.toObject ? doc.toObject() : doc;
    const formaterEntrees = (entrees = []) =>
        entrees
            .sort((a, b) => new Date(b.dateEffet) - new Date(a.dateEffet))
            .map(e => ({
                id: e._id?.toString(),
                montantMax: (e.montantMax ?? 0) / 100,
                dateEffet: e.dateEffet,
            }));
    return {
        midi: formaterEntrees(item.midi),
        hotel: formaterEntrees(item.hotel),
    };
};

// Récupère le document unique des plafonds
exports.listePlafonds = async (req, res) => {
    try {
        const doc = await getOuCreerDoc();
        res.status(200).json(formaterPourFront(doc));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Ajoute une entrée dans le tableau midi ou hotel
exports.ajoutPlafond = async (req, res) => {
    try {
        const { type, montantMax, dateEffet } = req.body;
        if (!['midi', 'hotel'].includes(type)) {
            return res.status(400).json({ message: 'Type invalide (midi ou hotel)' });
        }
        const doc = await getOuCreerDoc();
        doc[type].push({
            montantMax: toCents(montantMax),
            dateEffet: new Date(dateEffet),
        });
        await doc.save();
        res.status(201).json(formaterPourFront(doc));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Suppression d'une entrée dans l'historique (prévu pour plus tard)
exports.suppressionPlafond = async (req, res) => {
    try {
        const { type, id } = req.body;
        if (!['midi', 'hotel'].includes(type)) {
            return res.status(400).json({ message: 'Type invalide' });
        }
        const doc = await getOuCreerDoc();
        doc[type] = doc[type].filter(e => e._id.toString() !== id);
        await doc.save();
        res.status(200).json(formaterPourFront(doc));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};