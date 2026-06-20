const categorie = require('../models/categorie.js');

const formater = (doc) => ({
    id: doc._id.toString(),
    groupe: doc.groupe,
    nom: doc.nom,
    type: doc.type,
    bucket: doc.bucket ?? null,
    isDefault: doc.isDefault ?? false,
});

exports.listeCategories = async (req, res) => {
    try {
        const data = await categorie.find({ userId: req.userId }).sort({ type: 1, groupe: 1, nom: 1 });
        res.status(200).json(data.map(formater));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.ajoutCategorie = async (req, res) => {
    try {
        const { groupe, nom, type, bucket } = req.body;
        const doc = await new categorie({ userId: req.userId, groupe: String(groupe).trim(), nom: String(nom).trim(), type, bucket: bucket ?? null }).save();
        res.status(201).json(formater(doc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.modificationCategorie = async (req, res) => {
    try {
        const { id, groupe, nom, type, bucket } = req.body;
        const existing = await categorie.findOne({ _id: id, userId: req.userId });
        if (!existing) return res.status(404).json({ message: 'Catégorie introuvable' });
        if (existing.isDefault) return res.status(403).json({ message: 'Catégorie par défaut non modifiable' });
        const doc = await categorie.findOneAndUpdate(
            { _id: id, userId: req.userId },
            { $set: { groupe: String(groupe).trim(), nom: String(nom).trim(), type, bucket: bucket ?? null } },
            { returnDocument: 'after' }
        );
        res.status(200).json(formater(doc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.suppressionCategorie = async (req, res) => {
    try {
        const existing = await categorie.findOne({ _id: req.body.id, userId: req.userId });
        if (!existing) return res.status(404).json({ message: 'Catégorie introuvable' });
        if (existing.isDefault) return res.status(403).json({ message: 'Catégorie par défaut non supprimable' });
        await categorie.deleteOne({ _id: req.body.id, userId: req.userId });
        res.status(200).json({ message: 'Catégorie supprimée !' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
