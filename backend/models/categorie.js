const mongoose = require('mongoose');

const categorieSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    groupe: { type: String, required: true },
    nom: { type: String, required: true },
    type: { type: String, required: true, enum: ['Dépense', 'Recette'] },
    bucket: { type: String, enum: ['besoins', 'envies', null], default: null },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('categories', categorieSchema);
