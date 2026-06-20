const mongoose = require('mongoose');

const depensesRecettesSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    // On liera à la nouvelle collection 'Compte'
    compte: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'liste-comptes',
        required: true
    },
    dateDepensesRecettes: { type: Date, default: null },
    description: { type: String, required: true },
    depenses: { type: Number, default: 0 },
    recettes: { type: Number, default: 0 },

    // On s'assure que chaque booléen a une valeur par défaut pour éviter le "undefined"
    noteDeFrais: { type: Boolean, default: false },
    rembourser: { type: Boolean, default: false },
    fraisFixe: { type: Boolean, default: false },
    chequeEnCours: { type: Boolean, default: false },
    depenseRecettesAMasquer: { type: Boolean, default: false },

    // Virement interne (transfert entre deux comptes)
    virementInterne: { type: Boolean, default: false },
    compteDestination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'liste-comptes',
        default: null
    },

    // Référence au frais fixe parent (pour éviter les doublons de création automatique)
    fraisFixeRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'frais-fixe',
        default: null
    },
    // Identifiant de la période de déclenchement — ex. "2026-4" pour mai 2026 (mois 0-indexé)
    // Permet la déduplication par période : un placeholder null-date par frais fixe par période.
    fraisFixePeriode: { type: String, default: null },
    parts: { type: [Number], default: [50, 50] },
    sousCategorie: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', default: null },
    depassementPlafond: { type: Number, default: null }, // centimes — figé à la saisie (depenses - plafond actif à la date)
}, { timestamps: true });

module.exports = mongoose.model('depenses-recettes', depensesRecettesSchema);