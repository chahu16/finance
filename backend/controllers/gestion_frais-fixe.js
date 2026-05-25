const fraisFixe = require('../models/frais-fixe.js');
const compte = require('../models/compte.js');
const dayjs = require('dayjs');

// --- UTILS ---

/**
 * Calcule la dateEffet à partir de la dateFraisFixe :
 * on prend le jour de dateFraisFixe et on le place dans le mois en cours
 */
const parseDate = (valeur) => {
    if (!valeur) return null;

    // Déjà un objet Date ou dayjs
    if (valeur instanceof Date) return dayjs(valeur);

    const str = String(valeur).trim();

    // Format JJ/MM/AAAA ou JJ/MM/AA
    const matchFr = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (matchFr) {
        const [, jour, mois, annee] = matchFr;
        const anneeComplete = annee.length === 2 ? `20${annee}` : annee;
        return dayjs(`${anneeComplete}-${mois.padStart(2, '0')}-${jour.padStart(2, '0')}`);
    }

    // Format ISO ou autre reconnu par dayjs
    return dayjs(str);
};

const calculerDateEffet = (dateFraisFixe) => {
    if (!dateFraisFixe) return null;
    const date = parseDate(dateFraisFixe);
    if (!date || !date.isValid()) return null;
    const jourPrevu = date.date();
    return dayjs().date(jourPrevu).startOf('day').add(12, 'hour').toDate();
};

/**
 * Retourne le montant actif (le plus récent dont la dateEffet est passée)
 */
const getMontantActif = (montants = []) => {
    if (!montants.length) return 0;
    const now = new Date();
    const passes = montants
        .filter(m => m.dateEffet && new Date(m.dateEffet) <= now)
        .sort((a, b) => new Date(b.dateEffet) - new Date(a.dateEffet));
    return passes.length ? passes[0].montant / 100 : montants[montants.length - 1].montant / 100;
};

/**
 * Formate un frais fixe pour le front
 */
const formaterPourFront = (doc) => {
    const item = doc.toObject ? doc.toObject() : doc;
    return {
        id: item._id.toString(),
        compte: item.compte?.nom ?? "",
        dateFraisFixe: item.dateFraisFixe,
        description: item.description,
        periodicite: item.periodicite,
        type: item.type,
        montant: getMontantActif(item.montants),
        montants: item.montants.map(m => ({
            montant: m.montant / 100,
            dateEffet: m.dateEffet,
        })),
        parts: item.parts ?? [50, 50],
        archive: !!item.archive,
    };
};

// --- EXPORTS ---

exports.listeFraisFixes = async (req, res) => {
    try {
        const data = await fraisFixe.aggregate([
            { $addFields: { jourDuMois: { $dayOfMonth: "$dateFraisFixe" } } },
            { $sort: { jourDuMois: 1 } },
            { $lookup: { from: 'liste-comptes', localField: 'compte', foreignField: '_id', as: 'compte' } },
            { $unwind: { path: '$compte', preserveNullAndEmptyArrays: true } },
        ]);
        res.status(200).json(data.map(formaterPourFront));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.ajoutFraisFixes = async (req, res) => {
    try {
        const { compte: nomCompte, description, dateFraisFixe, periodicite, type, montant, parts } = req.body;

        const compteDoc = await compte.findOne({ nom: nomCompte });
        if (!compteDoc) return res.status(400).json({ message: `Compte introuvable : "${nomCompte}"` });

        const dateEffet = calculerDateEffet(dateFraisFixe);

        const doc = await new fraisFixe({
            compte: compteDoc._id,
            dateFraisFixe,
            description,
            periodicite: periodicite || 'mensuel',
            type,
            montants: [{ montant: Math.round(montant * 100), dateEffet }],
            parts: Array.isArray(parts) ? parts : [50, 50],
            archive: false,
        }).save();

        await doc.populate('compte');
        res.status(201).json(formaterPourFront(doc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.modificationFraisFixes = async (req, res) => {
    try {
        const { id, compte: nomCompte, dateFraisFixe, description, periodicite, type, montant, parts } = req.body;

        const compteDoc = await compte.findOne({ nom: nomCompte });
        if (!compteDoc) return res.status(400).json({ message: `Compte introuvable : "${nomCompte}"` });

        // On récupère le doc actuel pour comparer
        const docActuel = await fraisFixe.findById(id);
        if (!docActuel) return res.status(404).json({ message: 'Frais fixe introuvable' });

        const montantActuel = getMontantActif(docActuel.montants);
        const montantNouveauCentimes = Math.round(montant * 100);

        const montantAChange = montantNouveauCentimes !== Math.round(montantActuel * 100);
        const dateAChange = dayjs(dateFraisFixe).toISOString() !== dayjs(docActuel.dateFraisFixe).toISOString();

        // Calcul de la dateEffet selon ce qui a changé
        const dateEffet = dateAChange
            ? dayjs(dateFraisFixe).startOf('day').add(12, 'hour').toDate()
            : calculerDateEffet(docActuel.dateFraisFixe);

        // On push dans montants uniquement si montant ou date a changé
        const updateQuery = {
            $set: {
                compte: compteDoc._id,
                dateFraisFixe,
                description,
                periodicite,
                type,
                parts: Array.isArray(parts) ? parts : [50, 50],
            }
        };

        if (montantAChange || dateAChange) {
            updateQuery.$push = {
                montants: {
                    montant: montantNouveauCentimes,
                    dateEffet,
                }
            };
        }

        const doc = await fraisFixe
            .findByIdAndUpdate(id, updateQuery, { returnDocument: 'after' })
            .populate('compte');

        res.status(200).json(formaterPourFront(doc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.suppressionFraisFixes = async (req, res) => {
    try {
        await fraisFixe.deleteOne({ _id: req.body.id });
        res.status(200).json({ message: 'Frais fixe supprimé !' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.archiverFraisFixes = async (req, res) => {
    try {
        const doc = await fraisFixe.findByIdAndUpdate(
            req.body.id,
            { $set: { archive: !!req.body.archive } },
            { returnDocument: 'after' }
        ).populate('compte');
        res.status(200).json(formaterPourFront(doc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.ajoutFraisFixesBulk = async (req, res) => {
    try {
        const lignesRecues = req.body;
        if (!Array.isArray(lignesRecues)) throw new Error("Format tableau attendu");

        const erreurs = [];

        // Récupération des comptes en une seule requête
        const nomsComptesUnique = [...new Set(lignesRecues.map(l => l.compte))].filter(n => n);
        const comptesDocs = await compte.find({ nom: { $in: nomsComptesUnique } });
        const mappingComptes = {};
        comptesDocs.forEach(c => mappingComptes[c.nom] = c._id);

        const lignesValidees = [];

        lignesRecues.forEach((data, index) => {
            const numeroLigne = index + 2;
            const rowErrors = [];

            // 1. Validation Compte
            if (!data.compte || !mappingComptes[data.compte]) {
                rowErrors.push(`Compte inconnu : "${data.compte || 'VIDE'}"`);
            }

            // 2. Validation Description
            if (!data.description || String(data.description).trim() === "") {
                rowErrors.push("Description manquante");
            }

            // 3. Validation Type
            if (!data.type || !['depense', 'recette'].includes(String(data.type).toLowerCase())) {
                rowErrors.push(`Type invalide : "${data.type || 'VIDE'}" (attendu: depense ou recette)`);
            }

            // 4. Validation Montant
            const montant = parseFloat(String(data.montant || "").replace(',', '.'));
            if (isNaN(montant) || montant <= 0) {
                rowErrors.push("Montant manquant ou invalide (doit être > 0)");
            }

            // 5. Validation Date
            if (!data.dateFraisFixe || data.dateFraisFixe === "") {
                rowErrors.push("Date de prélèvement manquante");
            }

            // 6. Finalisation
            if (rowErrors.length > 0) {
                erreurs.push(`Ligne ${numeroLigne}: ${rowErrors.join(', ')}`);
            } else {
                const dateParsee = parseDate(data.dateFraisFixe)?.toDate() || null;
                const dateEffet = calculerDateEffet(data.dateFraisFixe);
                const parts = data.parts
                    ? String(data.parts).split(';').map(p => parseFloat(p.trim())).filter(p => !isNaN(p))
                    : [50, 50];
                lignesValidees.push({
                    compte: mappingComptes[data.compte],
                    description: String(data.description).trim(),
                    dateFraisFixe: dateParsee,
                    periodicite: data.periodicite || 'mensuel',
                    type: String(data.type).toLowerCase(),
                    montants: [{ montant: Math.round(montant * 100), dateEffet }],
                    parts: parts.length >= 2 ? parts : [50, 50],
                    archive: false,
                });
            }
        });

        if (erreurs.length > 0) {
            return res.status(400).json({
                message: "Erreurs de validation dans le fichier",
                details: erreurs
            });
        }

        const docsInseres = await fraisFixe.insertMany(lignesValidees);
        const docsPeuples = await fraisFixe.populate(docsInseres, { path: 'compte' });

        res.status(201).json(docsPeuples.map(formaterPourFront));

    } catch (err) {
        console.error("Erreur Bulk frais fixes:", err);
        res.status(500).json({ message: err.message });
    }
};