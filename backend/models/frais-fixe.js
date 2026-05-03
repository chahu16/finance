const mongoose = require('mongoose');

const comptesFraisFixe = mongoose.Schema({
    /*utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },*/
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
        dateEffet: { type: Date, default: null },
    }],
    parts: { type: [Number], default: [50, 50] },
    archive: { type: Boolean, default: false },
});

module.exports = mongoose.model('frais-fixe', comptesFraisFixe);