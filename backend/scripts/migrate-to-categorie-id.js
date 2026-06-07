require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    const depRec = mongoose.connection.collection('depenses-recettes');
    const fraisFix = mongoose.connection.collection('frais-fixes');

    // Convertit sousCategorie: '' → null (incompatible avec ObjectId)
    const { modifiedCount: n1 } = await depRec.updateMany(
        { sousCategorie: '' },
        { $set: { sousCategorie: null } }
    );
    const { modifiedCount: n2 } = await fraisFix.updateMany(
        { sousCategorie: '' },
        { $set: { sousCategorie: null } }
    );

    // Supprime le champ categorie devenu obsolète (dérivé du document référencé)
    const { modifiedCount: n3 } = await depRec.updateMany(
        { categorie: { $exists: true } },
        { $unset: { categorie: '' } }
    );
    const { modifiedCount: n4 } = await fraisFix.updateMany(
        { categorie: { $exists: true } },
        { $unset: { categorie: '' } }
    );

    console.log(`sousCategorie '' → null : ${n1} dépenses/recettes, ${n2} frais fixes`);
    console.log(`Suppression champ categorie : ${n3} dépenses/recettes, ${n4} frais fixes`);

    await mongoose.disconnect();
    console.log('Migration terminée.');
}

main().catch(err => { console.error(err); process.exit(1); });
