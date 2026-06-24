const categorie = require('../models/categorie.js');

const SEED_ACCESS = [
    { groupe: 'Revenus', nom: 'Paye', type: 'Recette', isDefault: true },
];

const SEED_INVESTISSEMENT = [
    { groupe: 'Finances', nom: 'Épargne', type: 'Dépense', isDefault: true },
    { groupe: 'Revenus', nom: 'Assurance vie', type: 'Recette', isDefault: true },
];

const SEED_NOTE_DE_FRAIS = [
    { groupe: 'Frais déplacements', nom: 'Hôtel + pdj',    type: 'Dépense', isDefault: true },
    { groupe: 'Frais déplacements', nom: 'Midi',           type: 'Dépense', isDefault: true },
    { groupe: 'Frais déplacements', nom: 'Soir',           type: 'Dépense', isDefault: true },
    { groupe: 'Frais déplacements', nom: 'Soirée étape',   type: 'Dépense', isDefault: true },
    { groupe: 'Remboursement',      nom: 'Frais pro',      type: 'Recette', isDefault: true },
];

async function seedSiAbsent(userId, entries) {
    for (const entry of entries) {
        await categorie.updateOne(
            { userId, groupe: entry.groupe, nom: entry.nom },
            { $set: { type: entry.type, bucket: entry.bucket ?? null, isDefault: true } },
            { upsert: true }
        );
    }
}

exports.seedCategories = async (req, res) => {
    const secret = req.headers['x-internal-secret'];
    if (secret !== process.env.FINANCE_INTERNAL_SECRET) {
        return res.status(403).json({ message: 'Accès refusé' });
    }

    const { userId, access, noteDeFrais, investissement } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId requis' });

    try {
        if (access)         await seedSiAbsent(userId, SEED_ACCESS);
        if (noteDeFrais)    await seedSiAbsent(userId, SEED_NOTE_DE_FRAIS);
        if (investissement) await seedSiAbsent(userId, SEED_INVESTISSEMENT);
        res.status(200).json({ message: 'Seed OK' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
