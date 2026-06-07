const categorie = require('../models/categorie.js');

const formater = (doc) => ({
    id: doc._id.toString(),
    groupe: doc.groupe,
    nom: doc.nom,
    type: doc.type,
});

exports.listeCategories = async (req, res) => {
    try {
        const data = await categorie.find().sort({ type: 1, groupe: 1, nom: 1 });
        res.status(200).json(data.map(formater));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.ajoutCategorie = async (req, res) => {
    try {
        const { groupe, nom, type } = req.body;
        const doc = await new categorie({ groupe: String(groupe).trim(), nom: String(nom).trim(), type }).save();
        res.status(201).json(formater(doc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.modificationCategorie = async (req, res) => {
    try {
        const { id, groupe, nom, type } = req.body;
        const doc = await categorie.findByIdAndUpdate(
            id,
            { $set: { groupe: String(groupe).trim(), nom: String(nom).trim(), type } },
            { returnDocument: 'after' }
        );
        if (!doc) return res.status(404).json({ message: 'Catégorie introuvable' });
        res.status(200).json(formater(doc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.suppressionCategorie = async (req, res) => {
    try {
        await categorie.deleteOne({ _id: req.body.id });
        res.status(200).json({ message: 'Catégorie supprimée !' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
