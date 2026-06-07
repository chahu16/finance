const mongoose = require('mongoose');

const categorieSchema = mongoose.Schema({
    groupe: { type: String, required: true },
    nom: { type: String, required: true },
    type: { type: String, required: true, enum: ['Dépense', 'Recette'] },
}, { timestamps: true });

module.exports = mongoose.model('categories', categorieSchema);
