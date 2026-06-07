const mongoose = require('mongoose');

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGODB_URI;

const categorieSchema = new mongoose.Schema({
    groupe: String,
    nom: String,
    type: String,
}, { timestamps: true });

const Categorie = mongoose.model('categories', categorieSchema);

const CATEGORIES = [
    // Voiture
    { groupe: 'Voiture', nom: 'Carburant', type: 'Dépense' },
    { groupe: 'Voiture', nom: 'Entretien / Réparations', type: 'Dépense' },
    { groupe: 'Voiture', nom: 'Assurance', type: 'Dépense' },
    { groupe: 'Voiture', nom: 'Stationnement / Péages', type: 'Dépense' },
    // Logement
    { groupe: 'Logement', nom: 'Crédit immobilier', type: 'Dépense' },
    { groupe: 'Logement', nom: 'Loyer', type: 'Dépense' },
    { groupe: 'Logement', nom: 'Charges copropriété', type: 'Dépense' },
    { groupe: 'Logement', nom: 'Électricité / Gaz', type: 'Dépense' },
    { groupe: 'Logement', nom: 'Eau', type: 'Dépense' },
    { groupe: 'Logement', nom: 'Internet', type: 'Dépense' },
    { groupe: 'Logement', nom: 'Assurance', type: 'Dépense' },
    { groupe: 'Logement', nom: 'Travaux / Entretien', type: 'Dépense' },
    // Vie quotidienne
    { groupe: 'Vie quotidienne', nom: 'Courses', type: 'Dépense' },
    { groupe: 'Vie quotidienne', nom: 'Restauration', type: 'Dépense' },
    { groupe: 'Vie quotidienne', nom: 'Abonnements', type: 'Dépense' },
    // Santé / Famille
    { groupe: 'Santé / Famille', nom: 'Santé', type: 'Dépense' },
    { groupe: 'Santé / Famille', nom: 'Mutuelle', type: 'Dépense' },
    { groupe: 'Santé / Famille', nom: 'Animaux', type: 'Dépense' },
    // Finances
    { groupe: 'Finances', nom: 'Impôts', type: 'Dépense' },
    { groupe: 'Finances', nom: 'Banque', type: 'Dépense' },
    { groupe: 'Finances', nom: 'Épargne', type: 'Dépense' },
    // Loisirs
    { groupe: 'Loisirs', nom: 'Vacances / Voyages', type: 'Dépense' },
    { groupe: 'Loisirs', nom: 'Sorties', type: 'Dépense' },
    { groupe: 'Loisirs', nom: 'Hobbies', type: 'Dépense' },
];

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('Connecté à MongoDB');

    // Reset catégories sur les transactions existantes
    const depRec = mongoose.connection.collection('depenses-recettes');
    const fraisFix = mongoose.connection.collection('frais-fixes');

    const { modifiedCount: n1 } = await depRec.updateMany({}, { $set: { categorie: '', sousCategorie: '' } });
    const { modifiedCount: n2 } = await fraisFix.updateMany({}, { $set: { categorie: '', sousCategorie: '' } });
    console.log(`Reset dépenses/recettes : ${n1} docs`);
    console.log(`Reset frais fixes : ${n2} docs`);

    // Supprime toutes les catégories existantes
    const deleted = await Categorie.deleteMany({});
    console.log(`Catégories supprimées : ${deleted.deletedCount}`);

    // Insère les nouvelles catégories
    const inserted = await Categorie.insertMany(CATEGORIES);
    console.log(`Catégories insérées : ${inserted.length}`);

    await mongoose.disconnect();
    console.log('Terminé.');
}

main().catch(err => { console.error(err); process.exit(1); });
