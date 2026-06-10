require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    const col = mongoose.connection.collection('frais-fixes');

    // Cible : documents avec un montantMensuel top-level non null
    // et au moins une entrée montants[] dont montantMensuel est null
    const docs = await col.find({
        montantMensuel: { $ne: null },
        'montants.montantMensuel': null,
    }).toArray();

    console.log(`${docs.length} document(s) à migrer`);

    let total = 0;
    for (const doc of docs) {
        const montantsMigres = doc.montants.map(m => ({
            ...m,
            montantMensuel: m.montantMensuel ?? doc.montantMensuel,
        }));

        await col.updateOne(
            { _id: doc._id },
            { $set: { montants: montantsMigres } }
        );
        total++;
        console.log(`  migré : ${doc.description} (${doc._id})`);
    }

    console.log(`\nMigration terminée — ${total} document(s) mis à jour.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
