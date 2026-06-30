const { toCents } = require('../utils/utils.js');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const mongoose = require('mongoose');
dayjs.extend(customParseFormat);

const Investissement = require('../models/investissement.js');

const parseDate = (raw) => {
    if (!raw || String(raw).toLowerCase() === 'null') return null;
    const d = (raw instanceof Date || String(raw).includes('T'))
        ? dayjs(raw)
        : dayjs(raw, ['DD/MM/YYYY', 'DD/MM/YY'], true);
    return d.isValid() ? d.startOf('day').add(12, 'hour').toDate() : null;
};

const formaterHistEntry = (h, investissementId) => ({
    id: h._id.toString(),
    investissementId: investissementId.toString(),
    date: h.date ? h.date.toISOString() : null,
    valeur: (h.valeur ?? 0) / 100,
});

const formaterInvPourFront = (doc) => {
    const item = doc.toObject ? doc.toObject() : doc;
    return {
        id: item._id?.toString() || item.id,
        nom: item.nom ?? '',
        type: item.type ?? '',
        courtier: item.courtier ?? '',
        montantInvesti: (item.montantInvesti ?? 0) / 100,
        tauxFrais: item.tauxFrais ?? 0,
        dateOuverture: item.dateOuverture ? item.dateOuverture.toISOString() : null,
        sommeInitiale: (item.sommeInitiale ?? 0) / 100,
        datePremierVersement: item.datePremierVersement ? item.datePremierVersement.toISOString() : null,
        fraisFixeRef: item.fraisFixeRef?.toString() || null,
        historique: (item.historique ?? []).map(h => formaterHistEntry(h, item._id)),
    };
};

// ─── Investissements ─────────────────────────────────────────────────────────

exports.listeInvestissements = async (req, res) => {
    try {
        const docs = await Investissement.find({ userId: req.userId }).sort({ nom: 1 });
        res.status(200).json(docs.map(formaterInvPourFront));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.ajoutInvestissement = async (req, res) => {
    try {
        const { nom, type, courtier, montantInvesti, tauxFrais, dateOuverture, sommeInitiale, datePremierVersement } = req.body;
        const doc = await Investissement.create({
            userId: req.userId,
            nom: nom?.trim(),
            type,
            courtier: courtier?.trim() || '',
            montantInvesti: toCents(montantInvesti ?? 0),
            tauxFrais: parseFloat(tauxFrais) || 0,
            dateOuverture: parseDate(dateOuverture),
            sommeInitiale: toCents(sommeInitiale ?? 0),
            datePremierVersement: parseDate(datePremierVersement),
            historique: [],
        });
        res.status(200).json(formaterInvPourFront(doc));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.modificationInvestissement = async (req, res) => {
    try {
        const { id, nom, type, courtier, montantInvesti, tauxFrais, dateOuverture, sommeInitiale, datePremierVersement } = req.body;
        const doc = await Investissement.findOneAndUpdate(
            { _id: id, userId: req.userId },
            {
                $set: {
                    nom: nom?.trim(),
                    type,
                    courtier: courtier?.trim() || '',
                    montantInvesti: toCents(montantInvesti ?? 0),
                    tauxFrais: parseFloat(tauxFrais) || 0,
                    dateOuverture: parseDate(dateOuverture),
                    sommeInitiale: toCents(sommeInitiale ?? 0),
                    datePremierVersement: parseDate(datePremierVersement),
                },
            },
            { returnDocument: 'after' }
        );

        res.status(200).json(formaterInvPourFront(doc));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.lierFraisFixe = async (req, res) => {
    try {
        const { id, fraisFixeRef } = req.body;
        const doc = await Investissement.findOneAndUpdate(
            { _id: id, userId: req.userId },
            { $set: { fraisFixeRef: fraisFixeRef || null } },
            { returnDocument: 'after' }
        );
        res.status(200).json(formaterInvPourFront(doc));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.suppressionInvestissement = async (req, res) => {
    try {
        const { id } = req.body;
        await Investissement.findOneAndDelete({ _id: id, userId: req.userId });
        res.status(200).json({ message: 'Investissement supprimé' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// ─── Historique (embarqué) ────────────────────────────────────────────────────

exports.ajoutHistorique = async (req, res) => {
    try {
        const { investissementId, date, valeur } = req.body;
        const newId = new mongoose.Types.ObjectId();
        const newEntry = { _id: newId, date: parseDate(date), valeur: toCents(valeur ?? 0) };
        await Investissement.findOneAndUpdate(
            { _id: investissementId, userId: req.userId },
            { $push: { historique: newEntry } }
        );
        res.status(200).json(formaterHistEntry(newEntry, investissementId));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.modificationHistorique = async (req, res) => {
    try {
        const { id, investissementId, date, valeur } = req.body;
        const doc = await Investissement.findOneAndUpdate(
            { userId: req.userId, 'historique._id': id },
            {
                $set: {
                    'historique.$.date': parseDate(date),
                    'historique.$.valeur': toCents(valeur ?? 0),
                },
            },
            { returnDocument: 'after' }
        );
        const updated = doc?.historique?.find(h => h._id.toString() === id);
        if (!updated) return res.status(404).json({ error: 'Entrée introuvable' });
        res.status(200).json(formaterHistEntry(updated, investissementId));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.suppressionHistorique = async (req, res) => {
    try {
        const { id } = req.body;
        await Investissement.findOneAndUpdate(
            { userId: req.userId, 'historique._id': id },
            { $pull: { historique: { _id: id } } }
        );
        res.status(200).json({ message: 'Entrée supprimée' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
