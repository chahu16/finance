/**
 * Migration : ajoute userId à tous les documents existants sans userId.
 * Usage : node scripts/migrate-add-userId.js <userId>
 * Exemple : node scripts/migrate-add-userId.js 6a33f2915c0131a775a72c93
 */
require('dotenv').config();
const mongoose = require('mongoose');

const userId = process.argv[2];
if (!userId || !/^[0-9a-f]{24}$/i.test(userId)) {
    console.error('Usage : node scripts/migrate-add-userId.js <userId (24 hex chars)>');
    process.exit(1);
}

const DepensesRecettes = require('../models/depenses-recettes.js');
const Compte = require('../models/compte.js');
const FraisFixe = require('../models/frais-fixe.js');
const Plafond = require('../models/plafond-notes-frais.js');
const Categorie = require('../models/categorie.js');

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    const uid = new mongoose.Types.ObjectId(userId);
    const filtre = { userId: { $exists: false } };
    const update = { $set: { userId: uid } };

    const [dr, cp, ff, pl, ca] = await Promise.all([
        DepensesRecettes.updateMany(filtre, update),
        Compte.updateMany(filtre, update),
        FraisFixe.updateMany(filtre, update),
        Plafond.updateMany(filtre, update),
        Categorie.updateMany(filtre, update),
    ]);

    console.log(`depenses-recettes : ${dr.modifiedCount} mis à jour`);
    console.log(`comptes           : ${cp.modifiedCount} mis à jour`);
    console.log(`frais-fixes       : ${ff.modifiedCount} mis à jour`);
    console.log(`plafonds          : ${pl.modifiedCount} mis à jour`);
    console.log(`categories        : ${ca.modifiedCount} mis à jour`);

    await mongoose.disconnect();
    console.log('Migration terminée.');
}

migrate().catch(err => { console.error(err); process.exit(1); });
