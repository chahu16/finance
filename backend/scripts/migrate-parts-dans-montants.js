require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    const col = mongoose.connection.collection('frais-fixes');

    // Cible : documents avec au moins une entrée montants[] dont parts est vide
    const docs = await col.find({
        'montants.0': { $exists: true },
        $or: [
            { 'montants.parts': { $exists: false } },
            { 'montants.parts': { $size: 0 } },
        ],
    }).toArray();

    console.log(`${docs.length} document(s) à migrer`);

    let total = 0;
    for (const doc of docs) {
        const fallbackParts = doc.parts?.length ? doc.parts : [50, 50];
        const montantsMigres = doc.montants.map(m => ({
            ...m,
            parts: m.parts?.length ? m.parts : fallbackParts,
        }));

        await col.updateOne(
            { _id: doc._id },
            { $set: { montants: montantsMigres } }
        );
        total++;
        console.log(`  migré : ${doc.description} (${doc._id}) → parts=${JSON.stringify(fallbackParts)}`);
    }

    console.log(`\nMigration terminée — ${total} document(s) mis à jour.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
