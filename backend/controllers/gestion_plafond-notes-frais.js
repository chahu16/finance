const plafond = require('../models/plafond-notes-frais.js');
const { toCents } = require('../utils/utils.js');

const formaterPourFront = (doc) => {
    const item = doc.toObject ? doc.toObject() : doc;
    return {
        id: item._id?.toString(),
        type: item.type,
        montantMax: (item.montantMax ?? 0) / 100,
        dateEffet: item.dateEffet,
    };
};

// Récupère tous les plafonds
exports.listePlafonds = async (req, res) => {
    try {
        const plafonds = await plafond.find().sort({ type: 1, dateEffet: -1 });
        res.status(200).json(plafonds.map(formaterPourFront));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Ajout ou mise à jour d'un plafond
exports.ajoutPlafond = async (req, res) => {
    try {
        const { type, montantMax, dateEffet } = req.body;
        const nouveau = await new plafond({
            type,
            montantMax: toCents(montantMax),
            dateEffet: new Date(dateEffet),
        }).save();
        res.status(201).json(formaterPourFront(nouveau));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Suppression d'un plafond
exports.suppressionPlafond = async (req, res) => {
    try {
        await plafond.deleteOne({ _id: req.body.id });
        res.status(200).json({ message: 'Plafond supprimé !' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Récupère le plafond actif pour une date donnée
exports.plafondActif = (plafonds, type, date) => {
    const plafondsFiltres = plafonds
        .filter(p => p.type === type && new Date(p.dateEffet) <= new Date(date))
        .sort((a, b) => new Date(b.dateEffet) - new Date(a.dateEffet));
    return plafondsFiltres[0] ?? null;
};