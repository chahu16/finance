const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth.js');
const requirePermission = require('../middleware/requirePermission.js');

const gestionDepensesRecettes = require('../controllers/gestion_depenses-recettes.js');
const gestionComptes = require('../controllers/gestion_comptes.js');
const gestionFraisFixes = require('../controllers/gestion_frais-fixe.js');
const gestionPlafonds = require('../controllers/gestion_plafond-notes-frais.js');
const gestionStatsMensuelles = require('../controllers/gestion_stats.js');
const gestionCategories = require('../controllers/gestion_categories.js');
const gestionSeed = require('../controllers/gestion_seed.js');
const gestionInvestissements = require('../controllers/gestion_investissements.js');

const admin = requirePermission('finance.admin');
const canImport = requirePermission('finance.import');

// Investissement OU admin
const canInvestissement = (req, res, next) => {
    if (!req.permissions?.finance?.investissement && !req.permissions?.finance?.admin) {
        return res.status(403).json({ message: 'Permission refusée' });
    }
    next();
};

router.use(express.json());

// ─── Route interne (service-to-service, sans JWT) ────────────────────────────
router.post('/internal/seed-categories', gestionSeed.seedCategories);

router.use(requireAuth);

// ─── Accès de base ────────────────────────────────────────────────────────────
router.get('/liste-depenses-recettes', gestionDepensesRecettes.dataGridDepensesRecettes);
router.get('/liste-compte-joint', gestionDepensesRecettes.dataGridCompteJoint);
router.post('/ajout-depense-recette', gestionDepensesRecettes.ajoutDepenseRecette);
router.post('/suppression-depense-recette', gestionDepensesRecettes.suppressionDepenseRecette);
router.post('/modification-depense-recette', gestionDepensesRecettes.modificationDepenseRecette);
router.post('/rembourser-notes-frais', gestionDepensesRecettes.rembourserNotesFrais);
router.get('/tableau-liste-noms-comptes', gestionComptes.listeNomsComptes);
router.get('/liste-categories', gestionCategories.listeCategories);
router.get('/stats-mensuelles', gestionStatsMensuelles.statsMensuelles);

// ─── Import CSV ───────────────────────────────────────────────────────────────
router.post('/ajout-depense-recette-bulk', canImport, gestionDepensesRecettes.ajoutDepenseRecetteBulk);

// ─── Administration ───────────────────────────────────────────────────────────
router.get('/tableau-liste-comptes', admin, gestionComptes.listeComptes);
router.post('/archiver-compte', admin, gestionComptes.archiverCompte);
router.post('/ajout-compte', admin, gestionComptes.ajoutCompte);
router.post('/ajout-compte-bulk', admin, gestionComptes.ajoutComptesBulk);
router.post('/modification-compte', admin, gestionComptes.modificationCompte);
router.post('/suppression-compte', admin, gestionComptes.suppressionCompte);
router.get('/check-compte/:id', admin, gestionComptes.checkCompte);

router.get('/liste-virements-internes', admin, gestionDepensesRecettes.listeVirements);
router.post('/ajout-virement-interne', admin, gestionDepensesRecettes.ajoutVirement);
router.post('/modification-virement-interne', admin, gestionDepensesRecettes.modificationVirement);
router.post('/suppression-virement-interne', admin, gestionDepensesRecettes.suppressionVirement);
router.post('/ajout-virement-interne-bulk', admin, gestionDepensesRecettes.ajoutVirementsBulk);

router.get('/liste-frais-fixe', admin, gestionFraisFixes.listeFraisFixes);
router.post('/ajout-frais-fixe', admin, gestionFraisFixes.ajoutFraisFixes);
router.post('/modification-frais-fixe', admin, gestionFraisFixes.modificationFraisFixes);
router.post('/suppression-frais-fixe', admin, gestionFraisFixes.suppressionFraisFixes);
router.post('/archiver-frais-fixe', admin, gestionFraisFixes.archiverFraisFixes);
router.post('/ajout-frais-fixe-bulk', admin, gestionFraisFixes.ajoutFraisFixesBulk);

router.get('/liste-plafonds-notes-frais', admin, gestionPlafonds.listePlafonds);
router.post('/ajout-plafond-notes-frais', admin, gestionPlafonds.ajoutPlafond);
router.post('/suppression-plafond-notes-frais', admin, gestionPlafonds.suppressionPlafond);

router.post('/ajout-categorie', admin, gestionCategories.ajoutCategorie);
router.post('/modification-categorie', admin, gestionCategories.modificationCategorie);
router.post('/suppression-categorie', admin, gestionCategories.suppressionCategorie);

// ─── Investissements ──────────────────────────────────────────────────────────
router.get('/liste-investissements', canInvestissement, gestionInvestissements.listeInvestissements);
router.post('/ajout-investissement', admin, gestionInvestissements.ajoutInvestissement);
router.post('/modification-investissement', admin, gestionInvestissements.modificationInvestissement);
router.post('/suppression-investissement', admin, gestionInvestissements.suppressionInvestissement);

router.post('/lier-investissement-frais-fixe', canInvestissement, gestionInvestissements.lierFraisFixe);
router.post('/ajout-investissement-historique', canInvestissement, gestionInvestissements.ajoutHistorique);
router.post('/modification-investissement-historique', canInvestissement, gestionInvestissements.modificationHistorique);
router.post('/suppression-investissement-historique', canInvestissement, gestionInvestissements.suppressionHistorique);

module.exports = router;