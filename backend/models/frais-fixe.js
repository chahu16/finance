const mongoose = require('mongoose');

const comptesFraisFixe = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    compte: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'liste-comptes',
        required: true
    },
    dateFraisFixe: { type: Date, default: null },
    description: { type: String, required: true },
    periodicite: { type: String, required: true, default: 'mensuel' },
    type: { type: String, required: true },
    montants: [{
        montant: { type: Number, default: 0 },
        montantMensuel: { type: Number, default: null },
        parts: { type: [Number], default: [] },
        dateEffet: { type: Date, default: null },
    }],
    archive: { type: Boolean, default: false },
    sousCategorie: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', default: null },
});

module.exports = mongoose.model('frais-fixe', comptesFraisFixe);