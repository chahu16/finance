const express = require('express');
const router = express.Router();

const gestionDepensesRecettes = require('../controllers/gestion_depenses-recettes.js');
const gestionComptes = require('../controllers/gestion_comptes.js');
const gestionFraisFixes = require('../controllers/gestion_frais-fixe.js');
const gestionPlafonds = require('../controllers/gestion_plafond-notes-frais.js');
const gestionStatsMensuelles = require('../controllers/gestion_stats.js');
const gestionCategories = require('../controllers/gestion_categories.js');

router.use(express.json());

router.get('/liste-depenses-recettes', gestionDepensesRecettes.dataGridDepensesRecettes);
router.get('/liste-compte-joint', gestionDepensesRecettes.dataGridCompteJoint);

router.post('/ajout-depense-recette', gestionDepensesRecettes.ajoutDepenseRecette);
router.post('/suppression-depense-recette', gestionDepensesRecettes.suppressionDepenseRecette);
router.post('/modification-depense-recette', gestionDepensesRecettes.modificationDepenseRecette);
router.post('/ajout-depense-recette-bulk', gestionDepensesRecettes.ajoutDepenseRecetteBulk);

router.get('/tableau-liste-noms-comptes', gestionComptes.listeNomsComptes); // pour le single select
router.get('/tableau-liste-comptes', gestionComptes.listeComptes); // pour le DataGrid paramétrage
router.post('/archiver-compte', gestionComptes.archiverCompte);
router.post('/ajout-compte', gestionComptes.ajoutCompte);
router.post('/ajout-compte-bulk', gestionComptes.ajoutComptesBulk);
router.post('/modification-compte', gestionComptes.modificationCompte);
router.post('/suppression-compte', gestionComptes.suppressionCompte);
router.get('/check-compte/:id', gestionComptes.checkCompte);


router.get('/liste-virements-internes', gestionDepensesRecettes.listeVirements);
router.post('/ajout-virement-interne', gestionDepensesRecettes.ajoutVirement);
router.post('/modification-virement-interne', gestionDepensesRecettes.modificationVirement);
router.post('/suppression-virement-interne', gestionDepensesRecettes.suppressionVirement);
router.post('/ajout-virement-interne-bulk', gestionDepensesRecettes.ajoutVirementsBulk);

router.get('/liste-frais-fixe', gestionFraisFixes.listeFraisFixes);
router.post('/ajout-frais-fixe', gestionFraisFixes.ajoutFraisFixes);
router.post('/modification-frais-fixe', gestionFraisFixes.modificationFraisFixes);
router.post('/suppression-frais-fixe', gestionFraisFixes.suppressionFraisFixes);
router.post('/archiver-frais-fixe', gestionFraisFixes.archiverFraisFixes);
router.post('/ajout-frais-fixe-bulk', gestionFraisFixes.ajoutFraisFixesBulk);

router.get('/liste-plafonds-notes-frais', gestionPlafonds.listePlafonds);
router.post('/ajout-plafond-notes-frais', gestionPlafonds.ajoutPlafond);
router.post('/suppression-plafond-notes-frais', gestionPlafonds.suppressionPlafond);

router.get('/stats-mensuelles', gestionStatsMensuelles.statsMensuelles);

router.get('/liste-categories', gestionCategories.listeCategories);
router.post('/ajout-categorie', gestionCategories.ajoutCategorie);
router.post('/modification-categorie', gestionCategories.modificationCategorie);
router.post('/suppression-categorie', gestionCategories.suppressionCategorie);

module.exports = router;