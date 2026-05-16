import { useState, useEffect, useMemo, useRef } from "react";
import { Box, Paper, Tabs, Tab } from "@mui/material";
import {
  appPlafondPlafondActifsHotelStyle, appAccordionDetailsStyle, appContainerStyle, appHeaderStyle, appGridContainerStyle, appPaperStyle, appLoadingStyle, appErrorStyle, appTabsContainerStyle, appPlafondGridStyle, appPlafondCardStyle, appPlafondTitreStyle, appPlafondActuelStyle, appPlafondRowStyle, appPlafondChampStyle, appPlafondTitreH6Style
} from './styles/AppStyles.js';
import {
  Accordion, AccordionSummary, AccordionDetails, Typography, FormControlLabel, Checkbox
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { snackbarAlertStyle } from './styles/GridStyles.js';
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { fr } from "date-fns/locale";

// --- COMPOSANTS ---
import FullFeaturedCrudGrid from "./DataGrid.jsx";
import StatCards from "./StatCards.jsx";
import StatCardCompteJoint from "./StatCardCompteJoint.jsx";
import StatsMensuelles from "./Stats/Statsmensuelles.jsx";

// --- CONFIGURATIONS ET LOGIQUE MÉTIER ---
import {
  getStatCardsCompteJoint, getStatCardsData, getStatStyles, getMonthPrefixLabel
} from './StatCardsConfig/DepensesRecettesStatCards.js';
import { valueFormatterDepensesRecettes } from "./config/Config.js";
import {
  trierLignesDepensesRecettes, getDepensesRecettesColumns, validateRow, addButtonLabelDepensesRecettes, getRowTypeLabeldepensesRecettes, applyBusinessRules,
} from "./gridConfigs/DepensesRecettesGrid.js";
import {
  getCompteJointColumns, validateCompteJoint, addButtonLabelCompteJoint,
  getRowTypeLabelCompteJoint, applyCompteJointBusinessRules
} from "./gridConfigs/Comptejointgrid.js";
import {
  getArchivedLabelComptes, getDepensesComptesColumns, getRowTypeLabelComptes, addButtonLabelComptes, validateCompte,
} from "./gridConfigs/ComptesGrid.js";
import {
  getVirementInterneColumns, validateVirementInterne,
  addButtonLabelVirementInterne, getRowTypeLabelVirementInterne
} from "./gridConfigs/VirementInterneGrid.js";
import {
  getArchivedLabelFraisFixes, getFraisFixeColumns, validateFraisFixe, addButtonLabelFraisFixe, getRowTypeLabelFraisFixe
} from "./gridConfigs/FraisfixeGrid.js";

// --- SERVICES API ---
import {
  useListePlafonds, AjoutPlafond, useListeNomsComptesFraisFixe, useListeCompteJoint, CreationVirementsBulk, ArchiverCompte, CreationComptesBulk, CreationFraisFixeBulk, useListeFraisFixes, CreationFraisFixe, ModificationFraisFixe, SuppressionFraisFixe, ArchiverFraisFixe, useListeVirements, CreationVirement, ModificationVirement, SuppressionVirement, useListeComptes, useListeNomsComptes, useListeBDDDepensesRecettes, ModificationDepenseRecette, SuppressionDepenseRecette, CreationDepenseRecette, CreationDepenseRecetteBulk, CreationCompte, ModificationCompte, SuppressionCompte, CheckCompte,
} from "./Serveur/DialogueServeurDepensesRecettes.js";

/**
 * ============================================================
 * COMPOSANT PRINCIPAL : APP
 * ============================================================
 */
export default function App() {
  // --- 2. ÉTATS LOCAUX ---
  const [rowsDepensesRecettes, setRowsDepensesRecettes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshKeyComptes, setRefreshKeyComptes] = useState(0);
  const [refreshKeyCompteJoint] = useState(0);
  const [rowsComptesLocal, setRowsComptesLocal] = useState([]);
  const [rowsCompteJointLocal, setRowsCompteJointLocal] = useState([]);
  const [rowsVirementsLocal, setRowsVirementsLocal] = useState([]);
  const [rowsFraisFixesLocal, setRowsFraisFixesLocal] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const dernieresStatsValides = useRef({});
  const lignesLocalesAjoutees = useRef([]);
  const lignesLocalesAjouteesCompteJoint = useRef([]);
  const [afficherComptesArchives, setAfficherComptesArchives] = useState(false);
  const [afficherFraisFixesArchives, setAfficherFraisFixesArchives] = useState(false);
  const compteJoint = rowsComptesLocal.find(c => c.estCompteJoint && !c.archive);
  const [refreshKeyPlafonds, setRefreshKeyPlafonds] = useState(0);
  const { plafonds, setPlafonds } = useListePlafonds(refreshKeyPlafonds);
  const [checkboxHotel, setCheckboxHotel] = useState({ hotelPDJ: false, soireeEtape: false });
  const [snackbarPlafond, setSnackbarPlafond] = useState({ open: false, message: '', severity: 'success' });
  const [erreursPlafond, setErreursPlafond] = useState({});
  const montantRefs = useRef({});
  const [datesPlafond, setDatesPlafond] = useState({});

  // --- 1. RÉCUPÉRATION DES DONNÉES (API) ---
  const { nomsComptes, loading: loadingNomsComptes } = useListeNomsComptes(refreshKey);
  const { nomsComptes: nomsComptesFraisFixe } = useListeNomsComptesFraisFixe(refreshKey);
  const { comptes: rowsComptes, loading: loadingComptes } = useListeComptes(refreshKeyComptes);
  const { lignes: serverRowsCompteJoint, loading: loadingCompteJoint } = useListeCompteJoint(refreshKeyCompteJoint);
  const { virements: serverRowsVirements } = useListeVirements(refreshKey);
  const { fraisFixes: serverRowsFraisFixes } = useListeFraisFixes(refreshKey);

  const { depensesRecettes: serverRowsDepensesRecettes, loading: loadingDepensesRecettes, error: errorDepensesRecettes } = useListeBDDDepensesRecettes(refreshKey);

  // Calcul automatique des statistiques dès que 'rows' change
  const statsData = useMemo(() => {
    const nomsComptesLocaux = new Set(rowsComptesLocal.map(c => c.nom));
    const nomsUtilises = new Set(rowsDepensesRecettes.map(r => r.compte).filter(Boolean));

    const estCoherent = [...nomsUtilises].every(nom => nomsComptesLocaux.has(nom));

    if (!estCoherent) return dernieresStatsValides.current; // ← garde les anciennes stats

    const comptesActifs = rowsComptesLocal.filter(c => !c.archive && !c.estCompteJoint);
    const nouvellesStats = getStatCardsData(
      [...rowsDepensesRecettes],
      rowsVirementsLocal,
      comptesActifs
    );

    dernieresStatsValides.current = nouvellesStats; // ← sauvegarde les nouvelles
    return nouvellesStats;
  }, [rowsDepensesRecettes, rowsVirementsLocal, rowsComptesLocal]);

  const statsCompteJoint = useMemo(() => {
    const result = compteJoint ? getStatCardsCompteJoint(
      rowsCompteJointLocal,
      compteJoint,
      rowsVirementsLocal,
      compteJoint.personneProprietaire ?? 0
    ) : null;
    return result;
  }, [rowsCompteJointLocal, compteJoint, rowsVirementsLocal]);

  // Compte joint visible si au moins 1 compte est marqué estCompteJoint
  const aUnCompteJoint = rowsComptesLocal.some(c => c.estCompteJoint);
  // rowsComptesLocal filtré selon le toggle
  const rowsComptesFiltres = afficherComptesArchives
    ? rowsComptesLocal.filter(c => c.archive)
    : rowsComptesLocal.filter(c => !c.archive);

  const rowsFraisFixesFiltres = afficherFraisFixesArchives
    ? rowsFraisFixesLocal.filter(ff => ff.archive)
    : rowsFraisFixesLocal.filter(ff => !ff.archive);

  useEffect(() => {
    if (rowsComptes && rowsComptes.length > 0) {
      setRowsComptesLocal(rowsComptes);
    }
  }, [rowsComptes]);

  useEffect(() => {
    if (serverRowsCompteJoint) {
      setRowsCompteJointLocal(() => {
        const aPreserver = lignesLocalesAjouteesCompteJoint.current.filter(r =>
          !serverRowsCompteJoint.some(s => s.id === r.id)
        );
        lignesLocalesAjouteesCompteJoint.current = aPreserver;
        return [...aPreserver, ...serverRowsCompteJoint];
      });
    }
  }, [serverRowsCompteJoint]);

  useEffect(() => {
    if (serverRowsVirements) setRowsVirementsLocal(serverRowsVirements);
  }, [serverRowsVirements]);

  useEffect(() => {
    if (serverRowsFraisFixes) {
      setRowsFraisFixesLocal(serverRowsFraisFixes);
    }
  }, [serverRowsFraisFixes]);

  // Etat pour gerer l'accordéon
  const [accordionOuvert, setAccordionOuvert] = useState(false);

  // --- LOGIQUE DES 2 JOURS ---
  // Au chargement, crée automatiquement les lignes dépenses/recettes
  // pour les frais fixes dont l'échéance approche (dans 2 jours ou moins)
  const creationFraisFixesDejaLancee = useRef(false);

  useEffect(() => {
    if (!serverRowsFraisFixes || !serverRowsDepensesRecettes) return;
    if (serverRowsFraisFixes.length === 0) return;
    if (loadingDepensesRecettes) return;

    if (creationFraisFixesDejaLancee.current) return;
    creationFraisFixesDejaLancee.current = true;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lignesACreer = [];

    const nomsComptesActifs = new Set(rowsComptesLocal.filter(c => !c.archive).map(c => c.nom));

    serverRowsFraisFixes
      .filter(ff => !ff.archive && nomsComptesActifs.has(ff.compte))
      .forEach(ff => {
        if (!ff.dateFraisFixe) return;

        // Extraction du jour prévu depuis la dateFraisFixe
        const jourPrevu = new Date(ff.dateFraisFixe).getDate();

        // Construction de la date d'échéance du mois en cours
        const dateEcheance = new Date(currentYear, currentMonth, jourPrevu);

        // Calcul du nombre de jours restants
        const diffMs = dateEcheance - now;
        const diffJours = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // On ne déclenche que si l'échéance est dans <= 2 jours (y compris passée)
        if (diffJours > 2) return;

        // Vérification : existe-t-il déjà une ligne ce mois-ci pour ce frais fixe ?
        // (ligne sans date ET avec le même fraisFixeRef)
        const toutesLesLignes = [...serverRowsDepensesRecettes, ...serverRowsCompteJoint ?? []];
        const dejaCreee = toutesLesLignes.some(row => {
          if (!row.fraisFixeRef) return false;
          if (String(row.fraisFixeRef) !== String(ff.id)) return false;
          const createdAt = new Date(row.createdAt);
          return (
            createdAt.getMonth() === currentMonth &&
            createdAt.getFullYear() === currentYear
          );
        });

        if (dejaCreee) return;

        // Construction de la ligne à créer
        lignesACreer.push({
          compte: ff.compte,
          dateDepensesRecettes: null,     // pas de date → en attente d'encaissement
          description: ff.description,
          depenses: ff.type === 'depense' ? ff.montant : 0,
          recettes: ff.type === 'recette' ? ff.montant : 0,
          fraisFixe: true,
          chequeEnCours: false,
          fraisFixeRef: ff.id,
          parts: ff.parts ?? [50, 50],
        });
      });

    if (lignesACreer.length === 0) return;

    // Création en série des lignes manquantes
    const creerLignes = async () => {
      const nouvellesLignes = [];
      for (const ligne of lignesACreer) {
        try {
          const result = await CreationDepenseRecette(ligne);
          nouvellesLignes.push(result);
        } catch (err) {
          console.error("Erreur création automatique frais fixe:", err);
        }
      }
      if (nouvellesLignes.length > 0) {
        const lignesCompteJoint = nouvellesLignes.filter(l => l.compte === compteJoint?.nom);
        const lignesNormales = nouvellesLignes.filter(l => l.compte !== compteJoint?.nom);
        lignesLocalesAjoutees.current = [...lignesLocalesAjoutees.current, ...lignesNormales];
        lignesLocalesAjouteesCompteJoint.current = [...lignesLocalesAjouteesCompteJoint.current, ...lignesCompteJoint];
        if (lignesNormales.length > 0) setRowsDepensesRecettes(prev => [...lignesNormales, ...prev]);
        if (lignesCompteJoint.length > 0) setRowsCompteJointLocal(prev => [...lignesCompteJoint, ...prev]);
      }
    };

    creerLignes();
  }, [serverRowsFraisFixes, serverRowsDepensesRecettes, loadingDepensesRecettes, rowsComptesLocal, compteJoint, serverRowsCompteJoint]);

  const handleAccordion = (panel) => (event, isExpanded) => {
    setAccordionOuvert(isExpanded ? panel : false);
  };

  /**
   * --- 3. GESTION DES MISES À JOUR (CRUD) ---
   * Gère la création et la modification des lignes vers la BDD.
   */
  const handleProcessRowUpdate = async (newRow, oldRow) => {
    try {
      let rawResult;

      // Détection : Est-ce une nouvelle ligne ?
      // (Via le flag 'isNew' ou la présence d'un tiret dans l'ID temporaire)
      const isNew = newRow.isNew || String(newRow.id).includes('-');

      if (isNew) {
        // On retire l'ID temporaire pour laisser MongoDB générer son propre _id
        const { id, ...donneesAEnvoyer } = newRow;
        rawResult = await CreationDepenseRecette(donneesAEnvoyer);
        setRowsDepensesRecettes(prev => {
          if (prev.some(r => r.id === rawResult.id)) return prev;
          return trierLignesDepensesRecettes([...prev, rawResult]);
        });
      } else {
        rawResult = await ModificationDepenseRecette(newRow);
        setRowsDepensesRecettes(prev =>
          trierLignesDepensesRecettes(prev.map(r => r.id === rawResult.id ? rawResult : r))
        );
      }

      // Transformation du résultat brut du serveur vers le format attendu par le Front
      return rawResult;

    } catch (error) {
      console.error("Erreur ProcessRowUpdate :", error);
      return oldRow; // En cas d'erreur, on annule visuellement le changement
    }
  };

  const handleProcessRowUpdateCompteJoint = async (newRow, oldRow) => {
    try {
      const isNew = newRow.isNew || String(newRow.id).includes('-');
      if (isNew) {
        const { id, ...donneesAEnvoyer } = newRow;
        const result = await CreationDepenseRecette({
          ...donneesAEnvoyer,
          compte: compteJoint?.nom,
          parts: donneesAEnvoyer.parts ?? [50, 50],
        });
        lignesLocalesAjouteesCompteJoint.current = [...lignesLocalesAjouteesCompteJoint.current, result];
        setRowsCompteJointLocal(prev => [...prev, result]);
        return result;
      }
      const result = await ModificationDepenseRecette(newRow);
      setRowsCompteJointLocal(prev => prev.map(r => r.id === result.id ? result : r));
      return result;
    } catch (error) {
      console.error("Erreur ProcessRowUpdate compte joint:", error);
      return oldRow;
    }
  };

  // Handler pour sauvegarder un virement interne
  const handleSaveVirement = async (newRow, oldRow) => {
    try {
      const isNew = newRow.isNew || String(newRow.id).includes('-');
      if (isNew) {
        const { id, ...donneesAEnvoyer } = newRow;
        return await CreationVirement(donneesAEnvoyer);
      } else {
        return await ModificationVirement(newRow);
      }
    } catch (error) {
      console.error("Erreur sauvegarde virement:", error);
      return oldRow;
    }
  };

  // Handler pour sauvegarder un frais fixe
  const handleSaveFraisFixe = async (newRow, oldRow) => {
    try {
      const isNew = newRow.isNew || String(newRow.id).includes('-');
      if (isNew) {
        const { id, ...donneesAEnvoyer } = newRow;
        if (!donneesAEnvoyer.parts || (donneesAEnvoyer.parts[0] === 0 && donneesAEnvoyer.parts[1] === 0)) {
          donneesAEnvoyer.parts = [50, 50];
        }
        const result = await CreationFraisFixe(donneesAEnvoyer);
        creationFraisFixesDejaLancee.current = false;
        setRefreshKey(prev => prev + 1);
        return result;
      }
      // Archivage détecté
      if (newRow.archive !== oldRow.archive) {
        return await ArchiverFraisFixe({ id: newRow.id, archive: newRow.archive });
      }
      return await ModificationFraisFixe(newRow);
    } catch (error) {
      console.error("Erreur sauvegarde frais fixe:", error);
      return oldRow;
    }
  };

  // Handler pour sauvegarder un compte (création ou modification)
  const handleSaveCompte = async (newRow, oldRow) => {
    try {
      const isNew = newRow.isNew || String(newRow.id).includes('-');
      if (isNew) {
        const { id, ...donneesAEnvoyer } = newRow;
        const result = await CreationCompte(donneesAEnvoyer);
        setRowsComptesLocal(prev => [...prev, result]);
        setRefreshKeyComptes(prev => prev + 1);
        if (result.estCompteJoint) {
          setActiveTab(3);
          setAccordionOuvert('comptes');
        }
        return result;
      }
      const result = await ModificationCompte(newRow);
      setRowsComptesLocal(prev => prev.map(c =>
        c.id === result.id ? result : c
      ));
      if (newRow.estCompteJoint && !oldRow.estCompteJoint) {
        setActiveTab(2);
        setAccordionOuvert('comptes');
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Vérifie avant le dialogue si le compte a des lignes liées
  const handleCheckCompte = async (row) => {
    const result = await CheckCompte(row.id);
    if (result.lignesLiees) {
      return { message: <>Ce compte a des mouvements liés — il sera <strong>archivé</strong> plutôt que supprimé.</>, isArchive: true };
    }
    return { message: <>Ce compte n'a aucun mouvement lié — il sera <strong>définitivement supprimé</strong>.</>, isArchive: false };
  };

  // Handler pour supprimer un compte (archive si lignes liées, supprime sinon)
  const handleDeleteCompte = async (row) => {
    const wasCompteJoint = row.estCompteJoint;
    const result = await SuppressionCompte({ id: row.id });
    if (result.action === 'archive') {
      // Le compte a été archivé → on force le rechargement
      setRefreshKey(prev => prev + 1);
    } else {
      setRowsComptesLocal(prev => prev.filter(c => c.id !== row.id));
    }
    if (wasCompteJoint) {
      setActiveTab(2);
      setAccordionOuvert('comptes');
    }
    return result;
  };

  // Handler pour archiver un compte
  const handleArchiveCompte = async (row) => {
    await ArchiverCompte({ id: row.id, archive: !row.archive });
    setRowsComptesLocal(prev => prev.map(c =>
      c.id === row.id ? { ...c, archive: !row.archive } : c
    ));
    setRefreshKey(prev => prev + 1);
  };

  // Handler pour archiver un frais fixe
  const handleArchiveFraisFixe = async (row) => {
    await ArchiverFraisFixe({ id: row.id, archive: !row.archive });
    setRowsFraisFixesLocal(prev => prev.map(ff =>
      ff.id === row.id ? { ...ff, archive: !row.archive } : ff
    ));
  };

  /**
   * --- 4. EFFETS (SYNCHRONISATION) ---
   */

  // Synchronisation des lignes du serveur vers l'état local au chargement
  useEffect(() => {
    if (serverRowsDepensesRecettes) {
      setRowsDepensesRecettes((prev) => {
        // On préserve les lignes temporaires (UUID avec tirets = en cours de saisie)
        const lignesTemp = prev.filter(r => String(r.id).includes('-'));
        const aPreserver = lignesLocalesAjoutees.current.filter(r =>
          !serverRowsDepensesRecettes.some(s => s.id === r.id)
        );
        lignesLocalesAjoutees.current = aPreserver;
        return [...lignesTemp, ...aPreserver, ...serverRowsDepensesRecettes];
      });
    }
  }, [serverRowsDepensesRecettes]);

  /**
   * --- 5. GESTION DES ÉTATS DE CHARGEMENT ET ERREURS ---
   */
  if (errorDepensesRecettes) {
    return <div style={appErrorStyle}>Erreur : {errorDepensesRecettes.message}</div>;
  }

  if ((loadingDepensesRecettes || loadingNomsComptes || loadingComptes || loadingCompteJoint) && (!serverRowsDepensesRecettes || serverRowsDepensesRecettes.length === 0)) {
    return (
      <div style={appLoadingStyle}>
        <div className="spinner"></div>
        <p>Récupération des données MongoDB...</p>
      </div>
    );
  }

  /**
   * --- 6. RENDU DE L'INTERFACE ---
   */
  return (
    <Box sx={appContainerStyle}>
      {/* Zone FIXE */}
      <Box sx={appHeaderStyle}>
        {/* Zone des cartes de statistiques haut de page */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '16px', mb: '24px' }}>
          <StatCards data={statsData} valueFormatter={valueFormatterDepensesRecettes} getStyles={(s) => getStatStyles(s.soldeInstantT, s.seuil, s.seuilOrange)} monthLabel={getMonthPrefixLabel()} />
          {statsCompteJoint && (
            <StatCardCompteJoint
              stats={statsCompteJoint.stats}
              global={statsCompteJoint.global}
              nomCompte={compteJoint?.nom}
              valueFormatter={valueFormatterDepensesRecettes}
              monthLabel={getMonthPrefixLabel()}
            />
          )}
        </Box>
      </Box>
      <Box sx={appTabsContainerStyle}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="fullWidth">
          <Tab label="Tableau de bord" />
          <Tab label="Dépenses / Recettes" />
          {aUnCompteJoint && <Tab label="Compte joint" />}
          <Tab label="Paramétrage" />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      <Box sx={appGridContainerStyle}>

        {activeTab === 0 && (
          <Paper sx={appPaperStyle}>
            <Box sx={{ p: 3 }}>
              <StatsMensuelles personneProprietaire={compteJoint?.personneProprietaire ?? 0} />
            </Box>
          </Paper>
        )}
        {activeTab === 1 && (
          <Paper sx={appPaperStyle}>
            <FullFeaturedCrudGrid
              columns={getDepensesRecettesColumns(nomsComptes)}
              rows={rowsDepensesRecettes}
              initialRows={rowsDepensesRecettes}
              onSaveRow={handleProcessRowUpdate}
              onSaveRowsBulk={CreationDepenseRecetteBulk}
              onDeleteRow={async (row) => {
                await SuppressionDepenseRecette(row);
                setRowsDepensesRecettes(prev => prev.filter(r => r.id !== row.id));
              }}
              onRowsUpdate={null}
              validateRow={validateRow}
              addButtonLabel={addButtonLabelDepensesRecettes}
              applyRules={applyBusinessRules}
              getRowTypeLabel={getRowTypeLabeldepensesRecettes}
              initialSortModel={[{ field: 'dateDepensesRecettes', sort: 'desc' }]}
              sortFn={trierLignesDepensesRecettes}
              focusField="dateDepensesRecettes"
            />
          </Paper>
        )}
        {activeTab === 2 && aUnCompteJoint && (
          <Paper sx={appPaperStyle}>
            <FullFeaturedCrudGrid
              columns={getCompteJointColumns(compteJoint?.personnes ?? [])}
              rows={rowsCompteJointLocal}
              initialRows={rowsCompteJointLocal}
              externalRows={rowsCompteJointLocal}
              onRowsUpdate={null}
              onSaveRow={handleProcessRowUpdateCompteJoint}
              onSaveRowsBulk={async (lignes) => {
                const lignesAvecCompte = lignes.map(l => ({
                  ...l,
                  compte: compteJoint?.nom,
                  parts: (() => {
                    const v = parseFloat(l.parts_0 ?? l.parts);
                    return !isNaN(v) ? [v, 100 - v] : [50, 50];
                  })(),
                }));
                const result = await CreationDepenseRecetteBulk(lignesAvecCompte);
                setRowsCompteJointLocal(prev => [...result, ...prev]);
                return result;
              }}
              onDeleteRow={async (row) => {
                await SuppressionDepenseRecette(row);
                setRowsCompteJointLocal(prev => prev.filter(r => r.id !== row.id));
              }}
              validateRow={validateCompteJoint}
              addButtonLabel={addButtonLabelCompteJoint}
              applyRules={applyCompteJointBusinessRules}
              getRowTypeLabel={getRowTypeLabelCompteJoint}
            />
          </Paper>
        )}
        {activeTab === (aUnCompteJoint ? 3 : 2) && (
          <Box sx={{ p: 2 }}>
            <Accordion expanded={accordionOuvert === 'comptes'} onChange={handleAccordion('comptes')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Comptes</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FullFeaturedCrudGrid
                  height="300px"
                  columns={getDepensesComptesColumns}
                  rows={rowsComptesFiltres}
                  initialRows={rowsComptesFiltres}
                  externalRows={rowsComptesFiltres}
                  onRowsUpdate={null}
                  onSaveRow={handleSaveCompte}
                  onSaveRowsBulk={async (lignes) => {
                    const result = await CreationComptesBulk(lignes);
                    setRowsComptesLocal(prev => [...result, ...prev]);
                    if (result.some(c => c.estCompteJoint)) {
                      setActiveTab(3);
                      setAccordionOuvert('comptes');
                    }
                    return result;
                  }}
                  onArchiveRow={handleArchiveCompte}
                  hideCopyButton
                  onDeleteRow={handleDeleteCompte}
                  onDeleteCheck={handleCheckCompte}
                  validateRow={validateCompte}
                  getRowTypeLabel={getRowTypeLabelComptes}
                  addButtonLabel={addButtonLabelComptes}
                  archivedLabel={getArchivedLabelComptes}
                  showArchived={afficherComptesArchives}
                  onToggleArchived={() => setAfficherComptesArchives(prev => !prev)}
                />
              </AccordionDetails>
            </Accordion>

            <Accordion expanded={accordionOuvert === 'fraisFixes'} onChange={handleAccordion('fraisFixes')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Frais fixes</Typography>
              </AccordionSummary>
              <AccordionDetails sx={appAccordionDetailsStyle}>
                <FullFeaturedCrudGrid
                  height="500px"
                  columns={getFraisFixeColumns(nomsComptesFraisFixe, compteJoint)}
                  rows={rowsFraisFixesFiltres}
                  initialRows={rowsFraisFixesFiltres}
                  externalRows={rowsFraisFixesFiltres}
                  onRowsUpdate={null}
                  onSaveRow={handleSaveFraisFixe}
                  onSaveRowsBulk={CreationFraisFixeBulk}
                  onArchiveRow={handleArchiveFraisFixe}
                  hideCopyButton
                  onDeleteRow={SuppressionFraisFixe}
                  validateRow={validateFraisFixe}
                  addButtonLabel={addButtonLabelFraisFixe}
                  getRowTypeLabel={getRowTypeLabelFraisFixe}
                  archivedLabel={getArchivedLabelFraisFixes}
                  showArchived={afficherFraisFixesArchives}
                  onToggleArchived={() => setAfficherFraisFixesArchives(prev => !prev)}
                />
              </AccordionDetails>
            </Accordion>

            <Accordion expanded={accordionOuvert === 'virements'} onChange={handleAccordion('virements')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Virements internes</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FullFeaturedCrudGrid
                  columns={getVirementInterneColumns(nomsComptesFraisFixe, compteJoint)}
                  rows={rowsVirementsLocal}
                  initialRows={rowsVirementsLocal}
                  onRowsUpdate={null}
                  onSaveRow={handleSaveVirement}
                  onSaveRowsBulk={CreationVirementsBulk}
                  onDeleteRow={SuppressionVirement}
                  validateRow={validateVirementInterne}
                  addButtonLabel={addButtonLabelVirementInterne}
                  getRowTypeLabel={getRowTypeLabelVirementInterne}
                />
              </AccordionDetails>
            </Accordion>
            {aUnCompteJoint && (
              <Accordion expanded={accordionOuvert === 'plafonds'} onChange={handleAccordion('plafonds')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Paramétrage notes de frais</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                    <Typography variant="h6" sx={appPlafondTitreH6Style}>
                      Paramétrage notes de frais
                    </Typography>
                    <Box sx={appPlafondGridStyle}>
                      {/* Card Midi et soir */}
                      <Box sx={appPlafondCardStyle}>
                        <Typography variant="body2" sx={appPlafondTitreStyle}>Midi et soir</Typography>
                        <Typography variant="caption" color="text.secondary" sx={appPlafondActuelStyle}>
                          Plafond actuel : {(plafonds.repas ?? [])[0]
                            ? <><strong>{(plafonds.repas)[0].montantMax} €</strong> depuis le {new Date((plafonds.repas)[0].dateEffet).toLocaleDateString('fr-FR')}</>
                            : <strong>Aucun</strong>}
                        </Typography>
                        <Box sx={appPlafondRowStyle}>
                          <Box sx={appPlafondChampStyle}>
                            <Typography variant="caption" color="text.secondary">Nouveau montant max (€)</Typography>
                            <TextField
                              type="number"
                              inputRef={el => montantRefs.current['repas'] = el}
                              placeholder="ex : 22.00"
                              size="small"
                              fullWidth
                              sx={{ '& .MuiOutlinedInput-root': erreursPlafond['montant-repas'] ? { borderColor: 'red' } : {} }}
                            />
                          </Box>
                          <Box sx={appPlafondChampStyle}>
                            <Typography variant="caption" color="text.secondary">Date d'effet</Typography>
                            <DatePicker
                              value={datesPlafond['repas'] ?? null}
                              onChange={(val) => setDatesPlafond(prev => ({ ...prev, repas: val }))}
                              slotProps={{ textField: { size: 'small', error: !!erreursPlafond['date-repas'] } }}
                            />
                          </Box>
                          <Button
                            variant="contained"
                            onClick={async () => {
                              const montant = parseFloat(montantRefs.current['repas']?.value);
                              const dateSelectionnee = datesPlafond['repas'];
                              const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());
                              setErreursPlafond({});
                              if (!montant || montant <= 0) {
                                setErreursPlafond(prev => ({ ...prev, 'montant-repas': true }));
                                setSnackbarPlafond({ open: true, message: 'Veuillez renseigner un montant valide', severity: 'error' });
                                return;
                              }
                              if (!dateSelectionnee || !isValidDate(dateSelectionnee)) {
                                setErreursPlafond(prev => ({ ...prev, 'date-repas': true }));
                                setSnackbarPlafond({ open: true, message: "Date manquante ou incomplète", severity: 'error' });
                                return;
                              }
                              if (dateSelectionnee > new Date()) {
                                setErreursPlafond(prev => ({ ...prev, 'date-repas': true }));
                                setSnackbarPlafond({ open: true, message: "La date d'effet ne peut pas être dans le futur", severity: 'error' });
                                return;
                              }
                              const result = await AjoutPlafond({ type: 'repas', montantMax: montant, dateEffet: dateSelectionnee.toISOString() });
                              setPlafonds(result);
                              setSnackbarPlafond({ open: true, message: 'Plafond enregistré avec succès', severity: 'success' });
                              setRefreshKeyPlafonds(prev => prev + 1);
                            }}
                          >
                            Enregistrer
                          </Button>
                        </Box>
                      </Box>

                      {/* Card Hôtel */}
                      <Box sx={appPlafondCardStyle}>
                        <Typography variant="body2" sx={appPlafondTitreStyle}>Hôtel</Typography>
                        <Box sx={appPlafondPlafondActifsHotelStyle}>
                          <Typography variant="caption" color="text.secondary">
                            Hôtel + pdj : {(plafonds.hotelPDJ ?? [])[0]
                              ? <><strong>{(plafonds.hotelPDJ)[0].montantMax} €</strong> depuis le {new Date((plafonds.hotelPDJ)[0].dateEffet).toLocaleDateString('fr-FR')}</>
                              : <strong>Aucun</strong>}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Soirée étape : {(plafonds.soireeEtape ?? [])[0]
                              ? <><strong>{(plafonds.soireeEtape)[0].montantMax} €</strong> depuis le {new Date((plafonds.soireeEtape)[0].dateEffet).toLocaleDateString('fr-FR')}</>
                              : <strong>Aucun</strong>}
                          </Typography>
                        </Box>
                        <Box sx={appPlafondRowStyle}>
                          <Box sx={appPlafondChampStyle}>
                            <Typography variant="caption" color="text.secondary">Nouveau montant max (€)</Typography>
                            <TextField
                              type="number"
                              inputRef={el => montantRefs.current['hotel'] = el}
                              placeholder="ex : 120.00"
                              size="small"
                              fullWidth
                              sx={{ '& .MuiOutlinedInput-root': erreursPlafond['montant-hotel'] ? { borderColor: 'red' } : {} }}
                            />
                          </Box>
                          <Box sx={appPlafondChampStyle}>
                            <Typography variant="caption" color="text.secondary">Date d'effet</Typography>
                            <DatePicker
                              value={datesPlafond['hotel'] ?? null}
                              onChange={(val) => setDatesPlafond(prev => ({ ...prev, hotel: val }))}
                              slotProps={{ textField: { size: 'small', error: !!erreursPlafond['date-hotel'] } }}
                            />
                          </Box>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={checkboxHotel.hotelPDJ}
                                onChange={() => setCheckboxHotel(prev => ({ ...prev, hotelPDJ: !prev.hotelPDJ }))}
                                size="small"
                              />
                            }
                            label={<Typography variant="caption">Hôtel + pdj</Typography>}
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={checkboxHotel.soireeEtape}
                                onChange={() => setCheckboxHotel(prev => ({ ...prev, soireeEtape: !prev.soireeEtape }))}
                                size="small"
                              />
                            }
                            label={<Typography variant="caption">Soirée étape</Typography>}
                          />
                          <Button
                            variant="contained"
                            onClick={async () => {
                              const montant = parseFloat(montantRefs.current['hotel']?.value);
                              const dateSelectionnee = datesPlafond['hotel'];
                              const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());
                              setErreursPlafond({});
                              if (!montant || montant <= 0) {
                                setErreursPlafond(prev => ({ ...prev, 'montant-hotel': true }));
                                setSnackbarPlafond({ open: true, message: 'Veuillez renseigner un montant valide', severity: 'error' });
                                return;
                              }
                              if (!dateSelectionnee || !isValidDate(dateSelectionnee)) {
                                setErreursPlafond(prev => ({ ...prev, 'date-hotel': true }));
                                setSnackbarPlafond({ open: true, message: "Date manquante ou incomplète", severity: 'error' });
                                return;
                              }
                              if (dateSelectionnee > new Date()) {
                                setErreursPlafond(prev => ({ ...prev, 'date-hotel': true }));
                                setSnackbarPlafond({ open: true, message: "La date d'effet ne peut pas être dans le futur", severity: 'error' });
                                return;
                              }
                              const nbCoches = Object.values(checkboxHotel).filter(Boolean).length;
                              if (nbCoches === 0) {
                                setSnackbarPlafond({ open: true, message: 'Veuillez cocher une option : Hôtel + petit déjeuner ou Soirée étape', severity: 'error' });
                                return;
                              }
                              if (nbCoches === 2) {
                                setSnackbarPlafond({ open: true, message: 'Veuillez cocher une seule option à la fois', severity: 'error' });
                                return;
                              }
                              const typeReel = checkboxHotel.hotelPDJ ? 'hotelPDJ' : 'soireeEtape';
                              const result = await AjoutPlafond({ type: typeReel, montantMax: montant, dateEffet: dateSelectionnee.toISOString() });
                              setPlafonds(result);
                              setCheckboxHotel({ hotelPDJ: false, soireeEtape: false });
                              setSnackbarPlafond({ open: true, message: 'Plafond enregistré avec succès', severity: 'success' });
                              setRefreshKeyPlafonds(prev => prev + 1);
                            }}
                          >
                            Enregistrer
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </LocalizationProvider>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}
      </Box>
      <Snackbar
        open={snackbarPlafond.open}
        autoHideDuration={4000}
        onClose={() => setSnackbarPlafond(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarPlafond(prev => ({ ...prev, open: false }))}
          severity={snackbarPlafond.severity}
          variant="filled"
          elevation={6}
          sx={snackbarAlertStyle}
        >
          {snackbarPlafond.message}
        </Alert>
      </Snackbar>
    </Box >
  );
}