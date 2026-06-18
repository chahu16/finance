const { toCents } = require('../utils/utils.js');

const depensesRecettes = require('../models/depenses-recettes.js');
const compte = require('../models/compte.js');
const plafondModel = require('../models/plafond-notes-frais.js');
const { calculerDepenseReelleParCategorie } = require('../utils/plafond-utils.js');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

// --- UTILS ---

/**
 * Nettoie et formate la date à midi pour éviter les décalages TZ
 */
const formaterDateMidi = (dateSource) => {
    if (!dateSource || String(dateSource).toLowerCase() === 'null') return null;
    let dateParsed = (dateSource instanceof Date || String(dateSource).includes('T'))
        ? dayjs(dateSource)
        : dayjs(dateSource, ['DD/MM/YYYY', 'DD/MM/YY'], true);

    return dateParsed.isValid() ? dateParsed.startOf('day').add(12, 'hour').toDate() : null;
};

/**
 * Transforme un objet brut reçu du Front/CSV en objet conforme au schéma Mongoose
 */
const transformerVersSchema = (data, mappingComptes = {}) => {
    const cleanData = { ...data };
    delete cleanData.id;
    delete cleanData._id;

    return {
        ...cleanData,
        compte: mappingComptes[data.compte] || data.compteId,
        dateDepensesRecettes: formaterDateMidi(data.dateDepensesRecettes),
        depenses: toCents(data.depenses),
        recettes: toCents(data.recettes),
        noteDeFrais: parseBooleen(data.notesFrais ?? data.noteDeFrais),
        rembourser: parseBooleen(data.notesFraisRemboursee ?? data.rembourser),
        fraisFixe: parseBooleen(data.fraisFixe),
        chequeEnCours: parseBooleen(data.chequeEnCours),
        depenseRecettesAMasquer: parseBooleen(data.aMasquer ?? data.depenseRecettesAMasquer),
        sousCategorie: data.sousCategorie || null,
        parts: (() => {
            if (Array.isArray(data.parts)) return data.parts;
            const v = parseFloat(String(data.parts ?? "").replace(',', '.'));
            if (!isNaN(v)) return [v, 100 - v];
            return [50, 50];
        })(),
    };
};

/**
 * Prépare la réponse pour le DataGrid (ID et nom du compte).
 * Si plafondDoc est fourni, calcule depenseReelle (dépassement en €) pour les notes de frais.
 */
const formaterPourFront = (doc, plafondDoc = null) => {
    const item = doc.toObject ? doc.toObject() : doc;
    const depensesCents = item.depenses ?? 0;

    let depenseReelle = null;
    if (plafondDoc && item.noteDeFrais && depensesCents > 0 && item.dateDepensesRecettes) {
        const catNom = item.sousCategorie?.nom ?? '';
        const reelCents = calculerDepenseReelleParCategorie(depensesCents, catNom, plafondDoc, item.dateDepensesRecettes);
        if (reelCents !== null) depenseReelle = reelCents / 100;
    }

    const result = {
        ...item,
        id: typeof item._id === 'object' ? item._id.toString() : item.id,
        compte: item.compte ? item.compte.nom : "",
        fraisFixeRef: item.fraisFixeRef ? item.fraisFixeRef.toString() : null,
        depenses: depensesCents / 100,
        recettes: (item.recettes ?? 0) / 100,
        parts: item.parts ?? [50, 50],
        categorie: item.sousCategorie?.groupe ?? '',
        sousCategorie: item.sousCategorie?._id?.toString() ?? '',
        depassementPlafond: item.depassementPlafond != null ? item.depassementPlafond / 100 : null,
    };

    if (depenseReelle !== null) result.depenseReelle = depenseReelle;

    return result;
};

/**
 * Préparation et validation booleen import CSV
 */
const parseBooleen = (value) => {
    const v = String(value ?? "").toLowerCase().trim();
    return ['true', '1', 'oui', 'x', 'vrai'].includes(v);
};

// Tri commun aux endpoints dépenses/recettes et compte joint :
// nulls en tête (chèques en cours), puis date décroissante, tiebreak alphabétique.
const trierParDateDesc = (a, b) => {
    const dateA = a.dateDepensesRecettes;
    const dateB = b.dateDepensesRecettes;
    if (!dateA && dateB) return -1;
    if (dateA && !dateB) return 1;
    if (new Date(dateA).getTime() === new Date(dateB).getTime()) {
        const descA = (a.description || "").trim().toLowerCase();
        const descB = (b.description || "").trim().toLowerCase();
        return descA.localeCompare(descB);
    }
    return new Date(dateB) - new Date(dateA);
};

/**
 * Résout les deux comptes d'un virement interne à partir de leurs noms.
 * Envoie la réponse d'erreur directement via res si un compte est introuvable ou si les deux sont identiques.
 * Retourne null si une erreur a été renvoyée, { sourceDoc, destDoc } sinon.
 */
const resolveComptesVirement = async (res, compteSource, compteDestination) => {
    const sourceDoc = await compte.findOne({ nom: compteSource });
    const destDoc = await compte.findOne({ nom: compteDestination });
    if (!sourceDoc) {
        res.status(400).json({ message: `Compte source introuvable : "${compteSource}"` });
        return null;
    }
    if (!destDoc) {
        res.status(400).json({ message: `Compte destination introuvable : "${compteDestination}"` });
        return null;
    }
    if (sourceDoc._id.equals(destDoc._id)) {
        res.status(400).json({ message: "Le compte source et le compte destination doivent être différents." });
        return null;
    }
    return { sourceDoc, destDoc };
};

/**
 * Calcule et persiste depassementPlafond (centimes) sur une note de frais déjà populée.
 * No-op si la ligne n'est pas une note de frais ou si aucun plafond ne s'applique.
 */
const sauvegarderDepassement = async (doc, plafondDoc) => {
    if (!doc.noteDeFrais || !doc.depenses || !doc.dateDepensesRecettes) return;
    const catNom = doc.sousCategorie?.nom ?? '';
    const depassementCents = calculerDepenseReelleParCategorie(doc.depenses, catNom, plafondDoc, doc.dateDepensesRecettes);
    if (depassementCents === null) return;
    await depensesRecettes.findByIdAndUpdate(doc._id, { $set: { depassementPlafond: depassementCents } });
    doc.depassementPlafond = depassementCents;
};

// --- EXPORTS ---

exports.dataGridDepensesRecettes = async (req, res) => {
    try {
        const [data, plafondDoc] = await Promise.all([
            depensesRecettes.find({
                virementInterne: { $ne: true },
            }).populate({
                path: 'compte',
                match: { archive: { $ne: true }, estCompteJoint: { $ne: true } }
            }).populate('sousCategorie'),
            plafondModel.findOne(),
        ]);

        const dataFiltree = data.filter(d => d.compte !== null);
        const formattedData = dataFiltree.map(d => formaterPourFront(d, plafondDoc)).sort(trierParDateDesc);

        res.status(200).json(formattedData);
    } catch (error) {
        console.error("Erreur tri Back:", error);
        res.status(400).json({ error: error.message });
    }
};

exports.ajoutDepenseRecette = async (req, res) => {
    try {
        const compteDoc = await compte.findOne({ nom: req.body.compte });
        if (req.body.compte && !compteDoc) {
            return res.status(400).json({ message: `Le compte "${req.body.compte}" est introuvable.` });
        }

        const dataPrepared = transformerVersSchema({ ...req.body, compteId: compteDoc?._id });
        const nouvelleLigne = await new depensesRecettes(dataPrepared).save();

        await nouvelleLigne.populate('compte');
        await nouvelleLigne.populate('sousCategorie');

        const plafondDoc = await plafondModel.findOne();
        await sauvegarderDepassement(nouvelleLigne, plafondDoc);
        res.status(201).json(formaterPourFront(nouvelleLigne, plafondDoc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.modificationDepenseRecette = async (req, res) => {
    try {
        const compteDoc = await compte.findOne({ nom: req.body.compte });
        const dataPrepared = transformerVersSchema({ ...req.body, compteId: compteDoc?._id });

        const updatedDoc = await depensesRecettes.findByIdAndUpdate(
            req.body.id,
            { $set: dataPrepared },
            { returnDocument: 'after' }
        ).populate('compte').populate('sousCategorie');

        const plafondDoc = await plafondModel.findOne();
        await sauvegarderDepassement(updatedDoc, plafondDoc);
        res.status(200).json(formaterPourFront(updatedDoc, plafondDoc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.ajoutDepenseRecetteBulk = async (req, res) => {
    try {
        const lignesRecues = req.body;
        if (!Array.isArray(lignesRecues)) throw new Error("Format tableau attendu");

        const erreurs = [];
        const nomsComptesUnique = [...new Set(lignesRecues.map(l => l.compte))].filter(n => n);

        const comptesDocs = await compte.find({ nom: { $in: nomsComptesUnique } });
        const mappingComptes = {};
        comptesDocs.forEach(c => mappingComptes[c.nom] = c._id);

        const lignesValidees = [];

        lignesRecues.forEach((data, index) => {
            const numeroLigne = index + 2;
            const rowErrors = []; // On utilise ce tableau pour collecter les erreurs de la ligne

            // 1. Validation Compte
            if (!data.compte || !mappingComptes[data.compte]) {
                rowErrors.push(`Compte inconnu : "${data.compte || 'VIDE'}"`);
            }

            // 2. Validation Description
            if (!data.description || String(data.description).trim() === "") {
                rowErrors.push("Description manquante");
            }

            // 3. Validation Montants
            const d = toCents(data.depenses);
            const r = toCents(data.recettes);
            if (d === 0 && r === 0) rowErrors.push("Dépense et Recette sont à 0");
            if (d > 0 && r > 0) rowErrors.push("Une ligne ne peut pas être à la fois une dépense et une recette");

            // 4. Validation Dates & Chèque en cours (LOGIQUE FUSIONNÉE)
            const dateBrute = data.dateDepensesRecettes;
            const dateValide = formaterDateMidi(dateBrute);
            const isCheque = !!(data.chequeEnCours === '1' || data.chequeEnCours === true || data.chequeEnCours === 'true' || data.chequeEnCours === 1);

            if (isCheque) {
                // RÈGLE : Si chèque, la date DOIT être vide
                if (dateBrute && dateBrute !== "" && dateBrute !== null) {
                    rowErrors.push("Un chèque en cours ne peut pas avoir de date d'opération");
                }
            } else {
                // RÈGLE : Si pas chèque, la date DOIT être valide
                if (!dateValide) {
                    rowErrors.push("Date manquante ou invalide");
                }
            }

            const compteDoc = comptesDocs.find(c => c.nom === data.compte);

            // 5. Validation booléens
            const valeursBooleensValides = ['true', 'false', '1', '0', 'oui', 'non', 'x', 'vrai'];

            const champsAValider = compteDoc?.estCompteJoint
                ? ['fraisFixe', 'chequeEnCours', 'depenseRecettesAMasquer']
                : ['fraisFixe', 'chequeEnCours', 'depenseRecettesAMasquer', 'noteDeFrais', 'notesFraisRemboursee'];

            champsAValider.forEach(champ => {
                const v = String(data[champ] ?? "").toLowerCase().trim();
                if (!valeursBooleensValides.includes(v)) {
                    rowErrors.push(`"${champ}" invalide ou vide : "${data[champ]}" (accepté : true, false, 1, 0)`);
                }
            });

            // 6. Validation parts (compte joint uniquement — si présent)
            if (compteDoc?.estCompteJoint) {
                if (data.parts_0 === undefined || data.parts_0 === null || data.parts_0 === "") {
                    rowErrors.push(`% manquant : la colonne parts est obligatoire pour le compte joint`);
                } else {
                    const v = parseFloat(String(data.parts_0 ?? "").replace(',', '.'));
                    if (isNaN(v) || v < 0 || v > 100) {
                        rowErrors.push(`% invalide : doit être un nombre entre 0 et 100`);
                    }
                }
            }

            // 7. Finalisation de la ligne
            if (rowErrors.length > 0) {
                erreurs.push(`Ligne ${numeroLigne}: ${rowErrors.join(', ')}`);
            } else {
                lignesValidees.push(transformerVersSchema(data, mappingComptes));
            }
        });

        if (erreurs.length > 0) {
            // C'est ce retour qui déclenche la Snackbar sur le Front
            return res.status(400).json({
                message: "Erreurs de validation dans le fichier",
                details: erreurs
            });
        }

        const docsInseres = await depensesRecettes.insertMany(lignesValidees);
        const docsPeuples = await depensesRecettes.populate(docsInseres, { path: 'compte' });

        res.status(201).json(docsPeuples.map(formaterPourFront));

    } catch (err) {
        console.error("Erreur Bulk:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.suppressionDepenseRecette = async (req, res, next) => {
    try {
        await depensesRecettes.deleteOne({ _id: req.body.id });
        res.status(200).json({ message: 'Objet supprimé !' });
    } catch (error) {
        res.status(400).json({ error });
    }
};

exports.dataGridCompteJoint = async (req, res) => {
    try {
        const [data, plafondDoc] = await Promise.all([
            depensesRecettes.find({
                virementInterne: { $ne: true },
            }).populate({
                path: 'compte',
                match: { estCompteJoint: true }
            }).populate('sousCategorie'),
            plafondModel.findOne(),
        ]);

        const dataFiltree = data.filter(d => d.compte !== null);
        const formattedData = dataFiltree.map(d => formaterPourFront(d, plafondDoc)).sort(trierParDateDesc);

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================
// VIREMENTS INTERNES
// ============================================================

/**
 * Prépare la réponse virement pour le DataGrid
 * (populate des deux comptes source et destination)
 */
const formaterVirementPourFront = (doc) => {
    const item = doc.toObject ? doc.toObject() : doc;
    return {
        id: item._id.toString(),
        compteSource: item.compte?.nom ?? "",
        compteDestination: item.compteDestination?.nom ?? "",
        montant: item.depenses / 100,
        dateVirement: item.dateDepensesRecettes,
        virementInterne: true,
    };
};

// Liste tous les virements internes
exports.listeVirements = async (req, res) => {
    try {
        const data = await depensesRecettes
            .find({ virementInterne: true })
            .populate('compte')
            .populate('compteDestination')
            .sort({ dateDepensesRecettes: -1 });

        res.status(200).json(data.map(formaterVirementPourFront));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Création d'un virement interne
exports.ajoutVirement = async (req, res) => {
    try {
        const { compteSource, compteDestination, montant, dateVirement } = req.body;

        const comptes = await resolveComptesVirement(res, compteSource, compteDestination);
        if (!comptes) return;
        const { sourceDoc: compteSourceDoc, destDoc: compteDestDoc } = comptes;

        const doc = await new depensesRecettes({
            compte: compteSourceDoc._id,
            compteDestination: compteDestDoc._id,
            dateDepensesRecettes: formaterDateMidi(dateVirement),
            description: "Virement interne",
            depenses: toCents(montant),
            recettes: 0,
            virementInterne: true,
        }).save();

        await doc.populate('compte');
        await doc.populate('compteDestination');

        res.status(201).json(formaterVirementPourFront(doc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Modification d'un virement interne
exports.modificationVirement = async (req, res) => {
    try {
        const { id, compteSource, compteDestination, montant, dateVirement } = req.body;

        const comptes = await resolveComptesVirement(res, compteSource, compteDestination);
        if (!comptes) return;
        const { sourceDoc: compteSourceDoc, destDoc: compteDestDoc } = comptes;

        const doc = await depensesRecettes.findByIdAndUpdate(
            id,
            {
                $set: {
                    compte: compteSourceDoc._id,
                    compteDestination: compteDestDoc._id,
                    dateDepensesRecettes: formaterDateMidi(dateVirement),
                    depenses: toCents(montant),
                }
            },
            { returnDocument: 'after' }
        ).populate('compte').populate('compteDestination');

        res.status(200).json(formaterVirementPourFront(doc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Suppression d'un virement interne
exports.suppressionVirement = async (req, res) => {
    try {
        await depensesRecettes.deleteOne({ _id: req.body.id, virementInterne: true });
        res.status(200).json({ message: 'Virement supprimé !' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================
// REMBOURSEMENT NOTES DE FRAIS
// ============================================================

exports.rembourserNotesFrais = async (req, res) => {
    try {
        const { sousCategorieId } = req.body;
        if (!sousCategorieId) return res.status(400).json({ message: 'sousCategorieId requis' });

        const plafondDoc = await plafondModel.findOne();

        // Remboursable (centimes) ou null si la catégorie n'est pas reconnue par un plafond.
        // null = note sans catégorie plafond valide (anciennes notes sans sous-catégorie).
        const remboursableOuNull = (note) => {
            if (note.depassementPlafond != null) return note.depenses - note.depassementPlafond;
            const catNom = note.sousCategorie?.nom ?? '';
            const dep = plafondDoc ? calculerDepenseReelleParCategorie(note.depenses, catNom, plafondDoc, note.dateDepensesRecettes) : null;
            if (dep === null) return null;
            return note.depenses - dep;
        };

        // Pour le marquage des nouvelles notes : si aucun plafond applicable, traiter comme entièrement remboursable.
        const montantRembBoursable = (note) => remboursableOuNull(note) ?? note.depenses;

        // 1. Total des remboursements reçus pour cette catégorie (comptes perso)
        const remboursementsRecus = await depensesRecettes.find({
            sousCategorie: sousCategorieId,
            recettes: { $gt: 0 },
            virementInterne: { $ne: true },
        }).populate({ path: 'compte', match: { archive: { $ne: true }, estCompteJoint: { $ne: true } } });

        const totalRecuCents = remboursementsRecus
            .filter(r => r.compte !== null)
            .reduce((acc, r) => acc + (r.recettes || 0), 0);

        // 2. Total déjà couvert par les notes déjà marquées remboursées (comptes perso)
        const notesDejaMarquees = await depensesRecettes.find({
            noteDeFrais: true,
            rembourser: true,
            virementInterne: { $ne: true },
        }).populate({ path: 'compte', match: { archive: { $ne: true }, estCompteJoint: { $ne: true } } })
          .populate('sousCategorie');

        // N'inclure dans totalAppliqué que les notes avec une catégorie plafond reconnue.
        // Les 815+ anciennes notes sans catégorie (rembourser:true, sousCategorie:null) sont ignorées :
        // elles auraient sinon gonflé totalAppliqué jusqu'à rendre le solde toujours négatif.
        const totalAppliqueCents = notesDejaMarquees
            .filter(n => n.compte !== null)
            .reduce((acc, n) => acc + (remboursableOuNull(n) ?? 0), 0);

        // 3. Solde disponible pour couvrir de nouvelles notes (cumul)
        let restantCents = totalRecuCents - totalAppliqueCents;

        // 4. Notes de frais non remboursées (comptes perso), triées date ASC
        const toutes = await depensesRecettes.find({
            noteDeFrais: true,
            rembourser: { $ne: true },
            virementInterne: { $ne: true },
        }).populate({ path: 'compte', match: { archive: { $ne: true }, estCompteJoint: { $ne: true } } })
          .populate('sousCategorie');

        const notesFrais = toutes.filter(n => n.compte !== null);
        notesFrais.sort((a, b) => {
            const dA = a.dateDepensesRecettes;
            const dB = b.dateDepensesRecettes;
            if (!dA && !dB) return 0;
            if (!dA) return 1;
            if (!dB) return -1;
            return new Date(dA) - new Date(dB);
        });

        const idsAMarquer = [];
        for (const note of notesFrais) {
            const rembBoursableCents = montantRembBoursable(note);
            if (rembBoursableCents <= restantCents) {
                idsAMarquer.push(note._id);
                restantCents -= rembBoursableCents;
            } else {
                break;
            }
        }

        if (idsAMarquer.length > 0) {
            await depensesRecettes.updateMany(
                { _id: { $in: idsAMarquer } },
                { $set: { rembourser: true } }
            );
        }

        const updatedDocs = idsAMarquer.length > 0
            ? await depensesRecettes.find({ _id: { $in: idsAMarquer } }).populate('compte').populate('sousCategorie')
            : [];
        const updatedFormatted = updatedDocs.map(d => formaterPourFront(d, plafondDoc));

        // Discordance : solde restant après marquage
        let discordance = null;
        if (restantCents > 0) {
            const notesRestantes = notesFrais.filter(n => !idsAMarquer.some(id => id.equals(n._id)));
            if (notesRestantes.length > 0) {
                const prochaine = notesRestantes[0];
                const prochaineRemb = montantRembBoursable(prochaine);
                discordance = {
                    type: 'insuffisant',
                    manque: (prochaineRemb - restantCents) / 100, // combien il manque pour couvrir la prochaine
                    notesRestantes: notesRestantes.map(n => ({
                        description: n.description,
                        date: n.dateDepensesRecettes,
                        depenses: montantRembBoursable(n) / 100,
                    })),
                };
            } else {
                discordance = { type: 'excedent', restant: restantCents / 100 };
            }
        }

        res.status(200).json({ updated: updatedFormatted, discordance, totalRecu: totalRecuCents / 100 });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// AJOUT virement depuis CSV
exports.ajoutVirementsBulk = async (req, res) => {
    try {
        const lignesRecues = req.body;
        if (!Array.isArray(lignesRecues)) throw new Error("Format tableau attendu");

        const erreurs = [];
        const nomsComptes = [...new Set([
            ...lignesRecues.map(l => l.compteSource),
            ...lignesRecues.map(l => l.compteDestination)
        ])].filter(n => n);

        const comptesDocs = await compte.find({ nom: { $in: nomsComptes } });
        const mappingComptes = {};
        comptesDocs.forEach(c => mappingComptes[c.nom] = c._id);

        const lignesValidees = [];

        lignesRecues.forEach((data, index) => {
            const numeroLigne = index + 2;
            const rowErrors = [];

            if (!data.compteSource || !mappingComptes[data.compteSource])
                rowErrors.push(`Compte source inconnu : "${data.compteSource || 'VIDE'}"`);

            if (!data.compteDestination || !mappingComptes[data.compteDestination])
                rowErrors.push(`Compte destination inconnu : "${data.compteDestination || 'VIDE'}"`);

            if (data.compteSource && data.compteDestination && data.compteSource === data.compteDestination)
                rowErrors.push("Compte source et destination identiques");

            const montant = parseFloat(String(data.montant || "").replace(',', '.'));
            if (isNaN(montant) || montant <= 0)
                rowErrors.push("Montant invalide (doit être > 0)");

            const dateValide = formaterDateMidi(data.dateVirement);
            if (!dateValide)
                rowErrors.push("Date manquante ou invalide");

            if (rowErrors.length > 0) {
                erreurs.push(`Ligne ${numeroLigne}: ${rowErrors.join(', ')}`);
            } else {
                lignesValidees.push({
                    compte: mappingComptes[data.compteSource],
                    compteDestination: mappingComptes[data.compteDestination],
                    dateDepensesRecettes: dateValide,
                    description: "Virement interne",
                    depenses: toCents(montant),
                    recettes: 0,
                    virementInterne: true,
                });
            }
        });

        if (erreurs.length > 0) {
            return res.status(400).json({
                message: "Erreurs de validation dans le fichier",
                details: erreurs
            });
        }

        const docsInseres = await depensesRecettes.insertMany(lignesValidees);
        const docsPeuples = await depensesRecettes.populate(docsInseres, [
            { path: 'compte' },
            { path: 'compteDestination' }
        ]);

        res.status(201).json(docsPeuples.map(formaterVirementPourFront));

    } catch (err) {
        console.error("Erreur Bulk virements:", err);
        res.status(500).json({ message: err.message });
    }
};