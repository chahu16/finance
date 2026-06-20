const mongoose = require('mongoose');

const comptesSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    archive: { type: Boolean, default: false },
    nom: { type: String, required: true },
    soldeInitial: { type: Number, default: 0 },
    sommeDeCote: { type: Number, default: 0 },
    seuil: { type: Number, default: 0 },
    seuilOrange: { type: Number, default: 0 },
    estCompteJoint: { type: Boolean, default: false },
    personnes: { type: [String], default: [] },
    personneProprietaire: { type: Number, default: 0 }
});

module.exports = mongoose.model('liste-comptes', comptesSchema);