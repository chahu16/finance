const { toCents } = require('../utils/utils.js');
const compte = require('../models/compte.js');

const formaterPourFront = (doc) => {
    const item = doc.toObject ? doc.toObject() : doc;
    return {
        id: item._id?.toString() || item.id,
        nom: item.nom ?? "",
        soldeInitial: (item.soldeInitial ?? 0) / 100,
        sommeDeCote: (item.sommeDeCote ?? 0) / 100,
        seuil: (item.seuil ?? 0) / 100,
        seuilOrange: item.seuilOrange ?? 0,
        estCompteJoint: !!item.estCompteJoint,
        personnes: item.personnes ?? [],
        personneProprietaire: item.personneProprietaire ?? 0,
        archive: !!item.archive,
    };
};

exports.listeNomsComptes = async (req, res, next) => {
    try {
        const filtre = { userId: req.userId, archive: { $ne: true } };
        if (req.query.avecCompteJoint !== 'true') {
            filtre.estCompteJoint = { $ne: true };
        }
        const comptes = await compte.find(filtre).sort({ nom: 1 });
        const nomsDesComptes = comptes.map(c => c.nom);
        res.status(200).json(nomsDesComptes);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.listeComptes = async (req, res, next) => {
    try {
        const comptes = await compte.find({ userId: req.userId }).sort({ nom: 1 });
        res.status(200).json(comptes.map(formaterPourFront));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.archiverCompte = async (req, res) => {
    try {
        const compteDoc = await compte.findOneAndUpdate(
            { _id: req.body.id, userId: req.userId },
            { $set: { archive: !!req.body.archive } },
            { returnDocument: 'after' }
        );
        res.status(200).json(compteDoc);
    } catch (error) {
        res.status(400).json({ error });
    }
};

exports.ajoutCompte = async (req, res) => {
    try {
        const { nom, soldeInitial, sommeDeCote, seuil, seuilOrange, estCompteJoint, personnes, personneProprietaire } = req.body;

        const existant = await compte.findOne({ userId: req.userId, nom: nom?.trim() });
        if (existant) return res.status(400).json({ message: `Un compte avec le nom "${nom}" existe déjà.` });

        const nouveauCompte = await new compte({
            userId: req.userId,
            nom: nom?.trim(),
            soldeInitial: toCents(soldeInitial),
            sommeDeCote: toCents(sommeDeCote),
            seuil: toCents(seuil),
            seuilOrange: seuilOrange ?? 0,
            estCompteJoint: !!estCompteJoint,
            personnes: personnes ?? [],
            personneProprietaire: personneProprietaire ?? 0,
            archive: false,
        }).save();

        res.status(201).json(formaterPourFront(nouveauCompte));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.modificationCompte = async (req, res) => {
    try {
        const { id, nom, soldeInitial, sommeDeCote, seuil, seuilOrange, estCompteJoint, personnes, personneProprietaire } = req.body;

        const existant = await compte.findOne({ userId: req.userId, nom: nom?.trim(), _id: { $ne: id } });
        if (existant) return res.status(400).json({ message: `Un compte avec le nom "${nom}" existe déjà.` });

        const compteDoc = await compte.findOneAndUpdate(
            { _id: id, userId: req.userId },
            {
                $set: {
                    nom: nom?.trim(),
                    soldeInitial: toCents(soldeInitial),
                    sommeDeCote: toCents(sommeDeCote),
                    seuil: toCents(seuil),
                    seuilOrange: seuilOrange ?? 0,
                    estCompteJoint: !!estCompteJoint,
                    personnes: personnes ?? [],
                    personneProprietaire: personneProprietaire ?? 0,
                }
            },
            { returnDocument: 'after' }
        );

        res.status(200).json(formaterPourFront(compteDoc));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.suppressionCompte = async (req, res) => {
    try {
        const depensesRecettes = require('../models/depenses-recettes.js');
        const { id } = req.body;

        const lignesLiees = await depensesRecettes.countDocuments({ compte: id, userId: req.userId });

        if (lignesLiees > 0) {
            const compteDoc = await compte.findOneAndUpdate(
                { _id: id, userId: req.userId },
                { $set: { archive: true } },
                { returnDocument: 'after' }
            );
            return res.status(200).json({ action: 'archive', compte: compteDoc });
        }

        await compte.deleteOne({ _id: id, userId: req.userId });
        res.status(200).json({ action: 'suppression' });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.checkCompte = async (req, res) => {
    try {
        const depensesRecettes = require('../models/depenses-recettes.js');
        const lignesLiees = await depensesRecettes.countDocuments({ compte: req.params.id, userId: req.userId });
        res.status(200).json({ lignesLiees: lignesLiees > 0 });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.ajoutComptesBulk = async (req, res) => {
    try {
        const lignesRecues = req.body;
        if (!Array.isArray(lignesRecues)) throw new Error("Format tableau attendu");

        const erreurs = [];
        const lignesValidees = [];

        const nomsCSV = lignesRecues.map(l => l.nom?.trim()).filter(n => n);
        const doublonsCSV = nomsCSV.filter((nom, i) => nomsCSV.indexOf(nom) !== i);

        const nomsExistants = await compte.find({ userId: req.userId, nom: { $in: nomsCSV } }).select('nom');
        const nomsEnBase = new Set(nomsExistants.map(c => c.nom));

        lignesRecues.forEach((data, index) => {
            const numeroLigne = index + 2;
            const rowErrors = [];
            const nom = data.nom?.trim();

            if (!nom || nom === "") {
                rowErrors.push("Nom du compte manquant");
            } else {
                if (doublonsCSV.includes(nom)) {
                    rowErrors.push(`Nom "${nom}" en doublon dans le fichier`);
                }
                if (nomsEnBase.has(nom)) {
                    rowErrors.push(`Un compte "${nom}" existe déjà en base`);
                }
            }

            const soldeInitial = parseFloat(String(data.soldeInitial || "0").replace(',', '.'));
            const sommeDeCote = parseFloat(String(data.sommeDeCote || "0").replace(',', '.'));
            const seuil = parseFloat(String(data.seuil || "0").replace(',', '.'));
            const seuilOrange = parseFloat(String(data.seuilOrange || "0").replace(',', '.'));
            if (isNaN(soldeInitial)) rowErrors.push("Solde initial invalide");
            if (isNaN(sommeDeCote)) rowErrors.push("Somme de côté invalide");
            if (isNaN(seuil)) rowErrors.push("Seuil invalide");
            if (!isNaN(seuilOrange) && (seuilOrange < 0 || seuilOrange > 100)) rowErrors.push("Seuil orange invalide (0-100)");

            if (rowErrors.length > 0) {
                erreurs.push(`Ligne ${numeroLigne}: ${rowErrors.join(', ')}`);
            } else {
                lignesValidees.push({
                    userId: req.userId,
                    nom,
                    soldeInitial: toCents(soldeInitial),
                    sommeDeCote: toCents(sommeDeCote),
                    seuil: toCents(seuil),
                    seuilOrange: seuilOrange ?? 0,
                    estCompteJoint: !!(data.estCompteJoint || data['compte joint']),
                    personnes: data.personnes ? data.personnes.split(';').map(p => p.trim()) : [],
                    personneProprietaire: parseInt(data.personneProprietaire ?? 0),
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

        const docsInseres = await compte.insertMany(lignesValidees);
        res.status(201).json(docsInseres.map(formaterPourFront));

    } catch (err) {
        console.error("Erreur Bulk comptes:", err);
        res.status(500).json({ message: err.message });
    }
};
