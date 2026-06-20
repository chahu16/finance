const mongoose = require('mongoose');

const entreePlafondSchema = new mongoose.Schema({
    montantMax: { type: Number, required: true },
    dateEffet: { type: Date, required: true },
}, { _id: true, timestamps: true });

const plafondNotesFraisSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    repas: { type: [entreePlafondSchema], default: [] }, // midi + soir
    hotelPDJ: { type: [entreePlafondSchema], default: [] }, // hôtel + petit déjeuner
    soireeEtape: { type: [entreePlafondSchema], default: [] }, // soirée étape
}, { timestamps: true });

module.exports = mongoose.model('plafond-notes-frais', plafondNotesFraisSchema);