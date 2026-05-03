const mongoose = require('mongoose');

const entreePlafondSchema = new mongoose.Schema({
    montantMax: { type: Number, required: true },
    dateEffet: { type: Date, required: true },
}, { _id: true, timestamps: true });

const plafondNotesFraisSchema = new mongoose.Schema({
    midi: { type: [entreePlafondSchema], default: [] },
    hotel: { type: [entreePlafondSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('plafond-notes-frais', plafondNotesFraisSchema);