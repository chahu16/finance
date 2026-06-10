require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    const col = mongoose.connection.collection('frais-fixes');

    const { modifiedCount } = await col.updateMany(
        { $or: [{ montantMensuel: { $exists: true } }, { parts: { $exists: true } }] },
        { $unset: { montantMensuel: '', parts: '' } }
    );

    console.log(`Champs legacy supprimés sur ${modifiedCount} document(s).`);
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
