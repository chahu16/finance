require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    const colFF = mongoose.connection.collection('frais-fixes');
    const colComptes = mongoose.connection.collection('liste-comptes');

    const comptes = await colComptes.find({}).toArray();
    const jointIds = new Set(
        comptes.filter(c => c.estCompteJoint).map(c => c._id.toString())
    );
    console.log(`Comptes joints : ${[...jointIds].map(id => comptes.find(c => c._id.toString() === id)?.nom).join(', ')}`);

    const docs = await colFF.find({}).toArray();
    let total = 0;

    for (const doc of docs) {
        const isJoint = jointIds.has(doc.compte?.toString());
        if (isJoint) continue;

        // Pour les comptes non-joints : parts = null partout
        const montantsMigres = doc.montants.map(m => ({ ...m, parts: null }));

        await colFF.updateOne(
            { _id: doc._id },
            { $set: { montants: montantsMigres, parts: null } }
        );
        total++;
        console.log(`  corrigé : ${doc.description} (${doc.compte} → non-joint)`);
    }

    console.log(`\nMigration terminée — ${total} document(s) corrigés.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
