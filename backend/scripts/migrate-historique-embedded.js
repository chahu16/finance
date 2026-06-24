/**
 * Migre les entrées de la collection `investissement-historique`
 * vers le tableau embarqué `historique` de chaque document `investissement`.
 *
 * Usage : node backend/scripts/migrate-historique-embedded.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Investissement = require('../models/investissement.js');
// Accès direct à l'ancienne collection sans passer par le modèle supprimé
const HistoriqueModel = mongoose.model(
    'investissement-historique',
    new mongoose.Schema({
        userId: mongoose.Schema.Types.ObjectId,
        investissementId: mongoose.Schema.Types.ObjectId,
        date: Date,
        valeur: Number,
    }, { strict: false })
);

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    const entries = await HistoriqueModel.find({});
    console.log(`${entries.length} entrées à migrer`);

    const grouped = {};
    for (const e of entries) {
        const key = e.investissementId.toString();
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({ _id: e._id, date: e.date, valeur: e.valeur });
    }

    let ok = 0, skip = 0;
    for (const [invId, hist] of Object.entries(grouped)) {
        const inv = await Investissement.findById(invId);
        if (!inv) { console.warn(`Investissement ${invId} introuvable — ignoré`); skip += hist.length; continue; }
        // Évite les doublons si le script est relancé
        const existingIds = new Set(inv.historique.map(h => h._id.toString()));
        const toAdd = hist.filter(h => !existingIds.has(h._id.toString()));
        if (toAdd.length) {
            await Investissement.findByIdAndUpdate(invId, { $push: { historique: { $each: toAdd } } });
        }
        ok += toAdd.length;
        skip += hist.length - toAdd.length;
    }

    console.log(`Migré : ${ok} | Ignorés (doublons/orphelins) : ${skip}`);
    await mongoose.disconnect();
    console.log('Terminé');
}

main().catch(err => { console.error(err); process.exit(1); });
