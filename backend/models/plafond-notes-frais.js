const mongoose = require('mongoose');

const plafondNotesFraisSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['midi', 'hotel'],
        required: true,
    },
    montantMax: {
        type: Number,
        required: true,
    },
    dateEffet: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('plafond-notes-frais', plafondNotesFraisSchema);