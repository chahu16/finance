const plafond = require('../models/plafond-notes-frais.js');
const { toCents } = require('../utils/utils.js');

const TYPES_VALIDES = ['repas', 'hotelPDJ', 'soireeEtape'];

const getOuCreerDoc = async (userId) => {
    let doc = await plafond.findOne({ userId });
    if (!doc) {
        doc = await new plafond({ userId, repas: [], hotelPDJ: [], soireeEtape: [] }).save();
    }
    return doc;
};

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
        repas: formaterEntrees(item.repas),
        hotelPDJ: formaterEntrees(item.hotelPDJ),
        soireeEtape: formaterEntrees(item.soireeEtape),
    };
};

exports.listePlafonds = async (req, res) => {
    try {
        const doc = await getOuCreerDoc(req.userId);
        res.status(200).json(formaterPourFront(doc));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.ajoutPlafond = async (req, res) => {
    try {
        const { type, montantMax, dateEffet } = req.body;
        if (!TYPES_VALIDES.includes(type)) {
            return res.status(400).json({ message: 'Type invalide (repas, hotelPDJ ou soireeEtape)' });
        }
        const doc = await getOuCreerDoc(req.userId);
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

exports.suppressionPlafond = async (req, res) => {
    try {
        const { type, id } = req.body;
        if (!TYPES_VALIDES.includes(type)) {
            return res.status(400).json({ message: 'Type invalide' });
        }
        const doc = await getOuCreerDoc(req.userId);
        doc[type] = doc[type].filter(e => e._id.toString() !== id);
        await doc.save();
        res.status(200).json(formaterPourFront(doc));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
