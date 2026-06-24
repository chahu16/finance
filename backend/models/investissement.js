const mongoose = require('mongoose');

const investissementSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    nom: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['PEA', 'Assurance vie', 'Immobilier', 'Compte à terme'] },
    courtier: { type: String, default: '' },
    montantInvesti: { type: Number, default: 0 },
    tauxFrais: { type: Number, default: 0 },
    dateOuverture: { type: Date, default: null },
    notes: { type: String, default: '' },
    fraisFixeRef: { type: mongoose.Schema.Types.ObjectId, ref: 'frais-fixe', default: null },
    historique: [{
        date: { type: Date, required: true },
        valeur: { type: Number, required: true },
    }],
}, { timestamps: true });

module.exports = mongoose.model('investissement', investissementSchema);
