const depensesRecettes = require('../models/depenses-recettes.js');
const plafondModel = require('../models/plafond-notes-frais.js');
const { calculerDepenseReelle } = require('../utils/plafond-utils.js');

exports.statsMensuelles = async (req, res) => {
    try {
        const personneProprietaire = parseInt(req.query.proprietaire ?? 0);
        const now = new Date();
        // 1 an glissant : mois en cours - 11 mois
        const debut = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Lignes normales (hors compte joint)
        const dataNormales = await depensesRecettes.find({
            userId: req.userId,
            virementInterne: { $ne: true },
            dateDepensesRecettes: { $gte: debut, $lte: fin }
        }).populate({ path: 'compte', match: { estCompteJoint: { $ne: true } } }).populate('sousCategorie');

        // Lignes compte joint
        const dataCompteJoint = await depensesRecettes.find({
            userId: req.userId,
            virementInterne: { $ne: true },
            dateDepensesRecettes: { $gte: debut, $lte: fin }
        }).populate({ path: 'compte', match: { estCompteJoint: true } }).populate('sousCategorie');

        const data = [
            ...dataNormales.filter(d => d.compte !== null),
            ...dataCompteJoint.filter(d => d.compte !== null).map(d => ({
                ...d.toObject(),
                depenses: d.depenses * ((d.parts?.[personneProprietaire] ?? 50) / 100),
                recettes: d.recettes * ((d.parts?.[personneProprietaire] ?? 50) / 100),
            }))
        ];

        // Initialiser les 12 mois glissants
        const mois = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            mois.push({
                label: `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
                mois: d.getMonth(),
                annee: d.getFullYear(),
                depenses: 0,
                notesFrais: 0,
                payeLoyer: 0,
                fraisFixe: 0,
            });
        }

        data.forEach(row => {
            const d = new Date(row.dateDepensesRecettes);
            const bucket = mois.find(m => m.mois === d.getMonth() && m.annee === d.getFullYear());
            if (!bucket) return;

            const depense = (row.depenses ?? 0) / 100;
            const recette = (row.recettes ?? 0) / 100;
            const desc = (row.description ?? "").toLowerCase();

            // Barres oranges — notes de frais (ancien flag ou catégorie Frais déplacements)
            if (row.noteDeFrais || row.sousCategorie?.groupe === 'Frais déplacements') {
                bucket.notesFrais += depense;
                return;
            }

            // Ligne jaune — paye + loyer
            if (desc.includes('paye') || desc.includes('location appartement')) {
                bucket.payeLoyer += recette;
                return;
            }

            // Barres bleues — dépenses hors masquées
            if (!row.depenseRecettesAMasquer && depense > 0) {
                if (row.fraisFixe) {
                    bucket.fraisFixe += depense;
                } else {
                    bucket.depenses += depense;
                }
            }
        });

        // Arrondir les montants
        mois.forEach(m => {
            m.depenses = Math.round(m.depenses * 100) / 100;
            m.notesFrais = Math.round(m.notesFrais * 100) / 100;
            m.payeLoyer = Math.round(m.payeLoyer * 100) / 100;
            m.fraisFixe = Math.round(m.fraisFixe * 100) / 100;
        });

        res.status(200).json(mois);
    } catch (err) {
        console.error("Erreur stats mensuelles:", err);
        res.status(500).json({ message: err.message });
    }
};