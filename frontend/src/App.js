import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTodayKey } from './hooks/useTodayKey.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useCompteRenameSync } from './hooks/useCompteRenameSync.js';
import { useFraisFixesPlaceholders } from './hooks/useFraisFixesPlaceholders.js';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import './App.css';
import FullFeaturedCrudGrid from './components/DataGrid.jsx';
import StatCard from './components/StatCard.jsx';
import StatCardJoint from './components/StatCardJoint.jsx';
import StatCardRecap from './components/StatCardRecap.jsx';
import DepensesChart from './components/DepensesChart.jsx';
import { validateRow } from './components/utils/DepensesRecettesValidation.js';
import { validateRow as validateCompteRow } from './components/utils/ComptesValidation.js';
import { validateRow as validateCompteJointRow } from './components/utils/CompteJointValidation.js';
import { validateRow as validateVirementRow } from './components/utils/VirementInternesValidation.js';
import { validateRow as validateFraisFixeBaseRow } from './components/utils/FraisFixesValidation.js';
import { GridEditSousCategorieCell } from './components/utils/SousCategorieCell.jsx';
import { DepensesRecettesColumns, snackbarMessages, initialSort, onFieldChange } from './components/gridConfigs/DepensesRecettesGrid.js';
import { initAuth, getPermissionsFromToken } from './api/client.js';
import { fetchDepensesRecettes, saveDepenseRecette, deleteDepenseRecette, rembourserNotesFrais } from './api/depensesRecettes.js';
import RemboursementDiscordanceDialog from './components/RemboursementDiscordanceDialog.jsx';
import ExportDialog from './components/ExportDialog.jsx';
import { fetchCategories, saveCategorie, deleteCategorie } from './api/categories.js';
import { CategoriesManager } from './components/CategoriesManager.jsx';
import PlafondNotesFrais from './components/PlafondNotesFrais.jsx';
import InvestissementsTab from './components/InvestissementsTab.jsx';
import { fetchInvestissements, saveInvestissement, deleteInvestissement, lierFraisFixe as lierFraisFixeApi } from './api/investissements.js';
import { saveInvestissementHistorique, deleteInvestissementHistorique } from './api/investissementsHistorique.js';
import { InvestissementsColumns, snackbarMessages as investissementsMessages, initialSort as investissementsInitialSort, extraRowDefaults as investissementsExtraRowDefaults } from './components/gridConfigs/InvestissementsGrid.js';
import { validateRow as validateInvestissementRow } from './components/utils/InvestissementsValidation.js';
import { ComptesColumns, snackbarMessages as comptesMessages, initialSort as comptesInitialSort, extraRowDefaults as comptesExtraRowDefaults } from './components/gridConfigs/ComptesGrid.js';
import { fetchComptes, saveCompte, deleteCompte, toggleArchiveCompte } from './api/comptes.js';
import { fetchFraisFixes, saveFraisFixe, deleteFraisFixe, toggleArchiveFraisFixe } from './api/fraisFixes.js';
import { CompteJointColumns, snackbarMessages as compteJointMessages, initialSort as compteJointInitialSort, onFieldChange as compteJointOnFieldChangeBase } from './components/gridConfigs/CompteJointGrid.js';
import { VirementInternesColumns, snackbarMessages as virementMessages, initialSort as virementInitialSort } from './components/gridConfigs/VirementInternesGrid.js';
import { fetchVirementInternes, saveVirementInterne, deleteVirementInterne } from './api/virementInternes.js';
import { FraisFixesColumns, snackbarMessages as fraisFixesMessages, initialSort as fraisFixesInitialSort, extraRowDefaults as fraisFixesExtraRowDefaults, onFieldChange as fraisFixesOnFieldChange } from './components/gridConfigs/FraisFixesGrid.js';
import { statCardsContainerSx } from './styles/StatCardStyles.js';
import { addButtonStyle } from './styles/GridStyles.js';
import { parametrageFormSx, formSectionTitleSx, formRowSx, computedValueSx } from './styles/CompteJointStyles.js';

// ─── Helpers module-level ──────────────────────────────────────────────────────

/**
 * Construit la config dynamique d'une colonne sousCategorie :
 * valueOptions filtrées par type (Recette/Dépense) et renderEditCell injecté.
 * @param {function} getIsRecette(row) → true si la ligne est une recette
 */
const makeSousCategorieColumn = (col, categoriesRows, getIsRecette) => ({
    ...col,
    valueOptions: (params) => {
        const isRecette = getIsRecette(params.row);
        return categoriesRows
            .filter(c => c.type === (isRecette ? 'Recette' : 'Dépense'))
            .map(c => ({ value: c.id, label: c.nom }));
    },
    renderEditCell: (params) => (
        <GridEditSousCategorieCell
            {...params}
            categoriesRows={categoriesRows}
            transactionType={getIsRecette(params.row) ? 'Recette' : 'Dépense'}
        />
    ),
});

/**
 * Construit l'unique action extra-row [Archiver | Désarchiver] pour un DataGrid.
 * @param {boolean} showArchived - true si l'onglet affiche les archivés (→ action = désarchiver)
 * @param {function} opts.toggleFn(id, archive) - appel API
 * @param {string}   opts.entityLabel - ex. 'Compte', 'Frais fixe'
 * @param {function} [opts.preCheck(id)] - appelé avant désarchivage ; retourne un message d'erreur ou null
 */
const makeArchiveAction = (showArchived, { toggleFn, entityLabel, preCheck } = {}) => [{
    icon: showArchived ? <UnarchiveIcon /> : <ArchiveIcon />,
    label: showArchived ? 'Désarchiver' : 'Archiver',
    onClick: async (id, setRows, showSnackbar) => {
        if (showArchived && preCheck) {
            const errMsg = preCheck(id);
            if (errMsg) { showSnackbar(errMsg, 'error'); return; }
        }
        try {
            await toggleFn(id, !showArchived);
            setRows(prev => prev.map(r => r.id === id ? { ...r, archived: !showArchived } : r));
            showSnackbar(
                `${entityLabel} ${showArchived ? 'désarchivé' : 'archivé'}`,
                showArchived ? 'success' : 'info'
            );
        } catch (err) {
            showSnackbar(err.message || `Erreur ${showArchived ? 'désarchivage' : 'archivage'}`, 'error');
        }
    },
}];

// Bouton toolbar pour basculer l'affichage des lignes archivées.
const ToggleArchivedButton = ({ shown, onToggle, label }) => (
    <Button variant="outlined" size="small" onClick={onToggle} sx={addButtonStyle}>
        {shown ? `Masquer les ${label} archivés` : `Afficher les ${label} archivés`}
    </Button>
);


function App() {
    const [tab, setTab] = useState(0);
    const [permissions, setPermissions] = useState(null);
    const [rows, setRows] = useState([]);
    const [comptesRows, setComptesRows] = useState([]);
    const [virementInternesRows, setVirementInternesRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [exportDialog, setExportDialog] = useState({ open: false, source: 'normal' });

    // Reçoit les permissions depuis le portail parent (postMessage)
    useEffect(() => {
        const handle = (e) => {
            if (e.data?.type === 'AUTH_PERMISSIONS') {
                setPermissions(e.data.permissions);
            }
        };
        window.addEventListener('message', handle);
        return () => window.removeEventListener('message', handle);
    }, []);

    // Si l'onglet Paramétrage est actif et l'accès admin est révoqué → retour à l'onglet 0
    useEffect(() => {
        if (tab === 4 && permissions !== null && !permissions?.finance?.admin) {
            setTab(0);
        }
    }, [permissions, tab]);

    const canImport        = !!permissions?.finance?.import;
    const canNoteDeFrais   = !!permissions?.finance?.noteDeFrais;
    const canRegle503020   = !!permissions?.finance?.regle503020;
    const canInvestissement = !!permissions?.finance?.investissement;

    const onDeleteConfirmDepenseRecette = useCallback(async (row) => {
        await deleteDepenseRecette(row);
        return 'delete';
    }, []);

    const [remboursementInfo, setRemboursementInfo] = useState(null);
    const pendingRemboursements = useRef([]);

    const onSaveVirementInterne = useCallback(async (row, isNew) => {
        const savedRow = await saveVirementInterne(row, isNew);
        setVirementInternesRows(prev => isNew
            ? [savedRow, ...prev.filter(r => r.id !== row.id)]
            : prev.map(r => r.id === row.id ? savedRow : r)
        );
        return savedRow;
    }, []);

    const onDeleteConfirmVirementInterne = useCallback(async (row) => {
        await deleteVirementInterne(row);
        setVirementInternesRows(prev => prev.filter(r => r.id !== row.id));
        return 'delete';
    }, []);

    // ─── Chargement initial — toutes les collections en parallèle ────────────
    useEffect(() => {
        const ok = r => r.status === 'fulfilled' ? r.value : [];
        initAuth()
            .then(() => {
                // En accès direct (sans iframe portail), le postMessage n'arrive jamais.
                // On initialise les permissions depuis le JWT si aucun postMessage reçu.
                setPermissions(prev => prev !== null ? prev : getPermissionsFromToken());
            })
            .then(() => Promise.allSettled([
                fetchComptes(),
                fetchDepensesRecettes(),
                fetchFraisFixes(),
                fetchVirementInternes(),
                fetchCategories(),
                fetchInvestissements(),
            ]))
            .then(([comptes, depRec, fraisFixes, virements, categories, investissements]) => {
                // Les requêtes admin / options (403) donnent un tableau vide sans bloquer le reste
                setComptesRows(ok(comptes));
                setRows(ok(depRec));
                setFraisFixesRows(ok(fraisFixes));
                setVirementInternesRows(ok(virements));
                setCategoriesRows(ok(categories));
                const invRows = ok(investissements);
                setInvestissementsRows(invRows);
                setInvestissementsHistoriqueRows(
                    invRows.flatMap(inv => (inv.historique ?? []).map(h => ({ ...h, investissementId: inv.id })))
                );
                // Erreur réseau sur les données de base → écran d'erreur
                if (depRec.status === 'rejected' && depRec.reason?.message !== 'Permission refusée') {
                    setLoadError(true);
                }
            })
            .catch((err) => { console.error('Chargement initial:', err); setLoadError(true); })
            .finally(() => setIsLoading(false));
    }, []);

    const onDeleteConfirmCompte = useCallback(async (row) => {
        const action = await deleteCompte(row);
        return { action };
    }, []);

    const [fraisFixesRows, setFraisFixesRows] = useState([]);
    const [categoriesRows, setCategoriesRows] = useState([]);
    const [investissementsRows, setInvestissementsRows] = useState([]);
    const [investissementsHistoriqueRows, setInvestissementsHistoriqueRows] = useState([]);

    const catRemboursementFraisPro = useMemo(
        () => categoriesRows.find(c => c.groupe === 'Remboursement' && c.nom === 'Frais pro') ?? null,
        [categoriesRows]
    );

    const onSaveDepenseRecette = useCallback(async (row, isNew) => {
        const savedRow = await saveDepenseRecette(row, isNew);

        if (
            catRemboursementFraisPro &&
            savedRow.recettes > 0 &&
            savedRow.sousCategorie === catRemboursementFraisPro.id
        ) {
            try {
                const result = await rembourserNotesFrais(catRemboursementFraisPro.id);
                if (result.updated.length > 0) {
                    // Stocké dans un ref pour être appliqué dans onRowsChangeDepRecNormal
                    // juste après que le DataGrid mette à jour son état local (sinon la mise à jour serait écrasée).
                    pendingRemboursements.current = result.updated;
                }
                setRemboursementInfo({
                    montant: result.totalRecu,
                    updated: result.updated,
                    discordance: result.discordance,
                });
            } catch (err) {
                console.error('Erreur remboursement notes de frais:', err);
            }
        }

        return savedRow;
    }, [catRemboursementFraisPro]);

    const onUpdateRetraitInvest = useCallback(async (row) => {
        const savedRow = await saveDepenseRecette(row, false);
        setRows(prev => prev.map(r => r.id === savedRow.id ? savedRow : r));
        return savedRow;
    }, []);

    // Wrapper onRowsChange pour le DataGrid des dépenses/recettes normales.
    // Applique les mises à jour de remboursement en attente (pendingRemboursements) sur les rows
    // que le DataGrid vient de produire, avant de les passer à setRows.
    const onRowsChangeDepRecNormal = useCallback((newRows) => {
        if (pendingRemboursements.current.length > 0) {
            const pending = pendingRemboursements.current;
            pendingRemboursements.current = [];
            setRows(newRows.map(r => {
                const u = pending.find(u => u.id === r.id);
                return u ?? r;
            }));
        } else {
            setRows(newRows);
        }
    }, []);

    const onDeleteConfirmFraisFixe = useCallback(async (row) => {
        await deleteFraisFixe(row);
        return 'delete';
    }, []);

    const onDeleteConfirmCategorie = useCallback(async (row) => {
        await deleteCategorie(row);
        return 'delete';
    }, []);
    const [showArchivedComptes, setShowArchivedComptes] = useState(false);
    const [showArchivedFraisFixes, setShowArchivedFraisFixes] = useState(false);
    const [expandedSection, setExpandedSection] = useState(null);
    const [compteJointConfig, setCompteJointConfig] = useLocalStorage(
        'compteJointConfig',
        { personne1: '', personne2: '', pourcentageDefaut: 50, pourcentageSoldeInitialMoi: null }
    );
    const [soldeInitialPctWarning, setSoldeInitialPctWarning] = useState(false);
    const [budget503020Config, setBudget503020Config] = useLocalStorage('budget503020Config', { periode: '12mois' });

    const todayKey = useTodayKey();

    useFraisFixesPlaceholders(fraisFixesRows, setRows, todayKey);

    useCompteRenameSync(comptesRows, { setRows, setFraisFixesRows, setVirementInternesRows });

    const validateCompteRowWithUniqueness = useCallback((row) => {
        const errors = validateCompteRow(row);
        const isDuplicate = comptesRows.some(r => r.id !== row.id && r.nomCompte === row.nomCompte);
        if (isDuplicate) {
            errors.nomCompte = 'Ce nom de compte existe déjà';
        }
        if (row.compteJoint) {
            const hasOtherJoint = comptesRows.some(r => r.id !== row.id && r.compteJoint && !r.archived);
            if (hasOtherJoint) {
                errors.compteJoint = 'Un seul compte joint est autorisé. Désactivez l\'autre d\'abord.';
            }
        }
        return errors;
    }, [comptesRows]);

    const resolveCompteDelete = useCallback((compte) => {
        const hasLinkedRows = rows.some(r => r.compte === compte.nomCompte);
        if (hasLinkedRows) {
            return {
                action: 'archive',
                dialogText: <><strong>{compte.nomCompte}</strong> possède des dépenses / recettes associées et sera archivé plutôt que supprimé.</>,
                message: `${compte.nomCompte} archivé (dépenses / recettes associées conservées)`,
            };
        }
        return { action: 'delete' };
    }, [rows]);

    const comptesExtraActions = useMemo(() => makeArchiveAction(showArchivedComptes, {
        toggleFn: toggleArchiveCompte,
        entityLabel: 'Compte',
        // Un seul compte joint actif est autorisé — bloquer le désarchivage si un autre existe déjà
        preCheck: (id) => {
            const row = comptesRows.find(r => r.id === id);
            if (row?.compteJoint && comptesRows.some(r => r.compteJoint && !r.archived && r.id !== id)) {
                return "Impossible : un compte joint est déjà actif. Archivez-le d'abord.";
            }
            return null;
        },
    }), [showArchivedComptes, comptesRows]);

    // Noms exclus du datagrid dépenses/recettes (archivés ou compte joint, par nom)
    // Partagé entre activeComptesOptions et depensesRowFilter pour garantir leur cohérence.
    const excludedComptesNames = useMemo(
        () => new Set(comptesRows.filter(c => c.archived || c.compteJoint).map(c => c.nomCompte)),
        [comptesRows]
    );

    // Noms des comptes autorisés dans le singleSelect dépenses/recettes :
    // ni archivé, ni joint, ni homonyme d'un compte joint/archivé
    const activeComptesOptions = useMemo(
        () => comptesRows
            .filter(c => !c.archived && !c.compteJoint && !excludedComptesNames.has(c.nomCompte))
            .map(c => c.nomCompte),
        [comptesRows, excludedComptesNames]
    );

    // Compte joint actif (non archivé)
    const compteJointData = useMemo(
        () => comptesRows.find(c => c.compteJoint && !c.archived) ?? null,
        [comptesRows]
    );
    const compteJointNom = compteJointData?.nomCompte ?? null;

    // Si le compte joint disparaît alors que l'onglet est actif → retour à l'onglet 0
    useEffect(() => {
        if (!compteJointNom && tab === 2) setTab(0);
    }, [compteJointNom, tab]);

    // Si plus aucun investissement alors que l'onglet est actif → retour à l'onglet 0
    useEffect(() => {
        if (canInvestissement && investissementsRows.length === 0 && tab === 3) setTab(0);
    }, [investissementsRows.length, canInvestissement, tab]);

    // Sync noms depuis la DB (compte joint) → compteJointConfig
    useEffect(() => {
        if (!compteJointData) return;
        const { personnes, personneProprietaire: idx } = compteJointData;
        if (!personnes || personnes.length < 2) return;
        const fmt = v => v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v;
        const p1 = fmt(personnes[idx] ?? '');
        const p2 = fmt(personnes[1 - idx] ?? '');
        setCompteJointConfig(prev => {
            if (prev.personne1 === p1 && prev.personne2 === p2) return prev;
            return { ...prev, personne1: p1, personne2: p2 };
        });
    }, [compteJointData]);

    const catAssuranceVieId = useMemo(
        () => categoriesRows.find(c => c.groupe === 'Revenus' && c.nom === 'Assurance vie')?.id ?? null,
        [categoriesRows]
    );

    const avInvestissements = useMemo(
        () => investissementsRows.filter(inv => inv.type === 'Assurance vie'),
        [investissementsRows]
    );

    // Colonnes dépenses/recettes avec valueOptions dynamiques (comptes + sousCategorie selon type)
    const depensesRecettesColumns = useMemo(() => {
        const cols = DepensesRecettesColumns.map(col => {
            if (col.field === 'compte') return { ...col, valueOptions: activeComptesOptions };
            if (col.field === 'sousCategorie') return makeSousCategorieColumn(
                col, categoriesRows, (row) => (row?.recettes ?? 0) > 0
            );
            return col;
        });

        if (canInvestissement && catAssuranceVieId && avInvestissements.length > 0) {
            cols.push({
                field: 'investissementRef',
                headerName: 'AV liée',
                width: 160,
                editable: true,
                isCellEditable: (params) => params.row.sousCategorie === catAssuranceVieId,
                renderCell: (params) => {
                    if (params.row.sousCategorie !== catAssuranceVieId) return null;
                    const inv = avInvestissements.find(i => i.id === params.value);
                    return (
                        <Typography sx={{ fontSize: '0.875rem', color: inv ? 'inherit' : '#bbb', fontStyle: inv ? 'normal' : 'italic' }}>
                            {inv ? inv.nom : '—'}
                        </Typography>
                    );
                },
                renderEditCell: (params) => (
                    <Select
                        value={params.value || ''}
                        onChange={e => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value || null })}
                        fullWidth
                        size="small"
                        displayEmpty
                        sx={{ fontSize: '0.875rem' }}
                    >
                        <MenuItem value=""><em>— Aucune —</em></MenuItem>
                        {avInvestissements.map(inv => (
                            <MenuItem key={inv.id} value={inv.id} sx={{ fontSize: '0.875rem' }}>{inv.nom}</MenuItem>
                        ))}
                    </Select>
                ),
            });
        }

        return cols;
    }, [activeComptesOptions, categoriesRows, canInvestissement, catAssuranceVieId, avInvestissements]);

    // Tous les comptes non-archivés, non-joints avec soldeInitial → récapitulatif global
    const comptesRecapData = useMemo(
        () => comptesRows.filter(c => !c.archived && !c.compteJoint && c.soldeInitial != null),
        [comptesRows]
    );

    // Comptes actifs avec soldeInitial défini, non joints, au moins une transaction → StatCards
    const comptesActifsData = useMemo(
        () => comptesRows
            .filter(c => !c.archived && !c.compteJoint && c.soldeInitial != null && rows.some(r => r.compte === c.nomCompte))
            .sort((a, b) => a.nomCompte.localeCompare(b.nomCompte, 'fr')),
        [comptesRows, rows]
    );

    // Colonnes comptes : checkbox compteJoint désactivée visuellement si un compte joint existe déjà
    const comptesColumnsWithJointControl = useMemo(() => {
        const hasCompteJoint = comptesRows.some(c => c.compteJoint && !c.archived);
        return ComptesColumns.map(col => {
            if (col.field !== 'compteJoint') return col;
            return {
                ...col,
                isCellEditable: (params) => !hasCompteJoint || params.row.compteJoint,
                renderCell: (params) => {
                    const isDisabled = hasCompteJoint && !params.row.compteJoint;
                    return (
                        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Checkbox
                                checked={!!params.value}
                                disabled={isDisabled}
                                size="small"
                                tabIndex={-1}
                            />
                        </Box>
                    );
                },
            };
        });
    }, [comptesRows]);

    // Colonnes compte joint avec noms des personnes injectés dynamiquement
    const compteJointColumns = useMemo(() => {
        const p1 = compteJointConfig.personne1 || 'Moi';
        const p2 = compteJointConfig.personne2 || 'Autre';
        return CompteJointColumns.map(col => {
            if (col.field === 'pourcentageMoi')  return { ...col, headerName: `Part ${p1} (%)` };
            if (col.field === 'pourcentageAutre') return { ...col, headerName: `Part ${p2} (%)` };
            if (col.field === 'sousCategorie') return makeSousCategorieColumn(
                col, categoriesRows, (row) => (row?.recettes ?? 0) > 0
            );
            return col;
        });
    }, [compteJointConfig.personne1, compteJointConfig.personne2, categoriesRows]);

    // Valeurs par défaut pour les nouvelles lignes du compte joint
    const compteJointExtraRowDefaults = useMemo(() => ({
        compte: compteJointNom ?? '',
        pourcentageMoi: Math.min(100, Math.max(0, compteJointConfig.pourcentageDefaut || 0)),
        categorie: '',
        sousCategorie: '',
    }), [compteJointNom, compteJointConfig.pourcentageDefaut]);

    // Tous les comptes non-archivés (virements internes + frais fixes partagent la même liste)
    const allNonArchivedComptesOptions = useMemo(
        () => comptesRows.filter(c => !c.archived).map(c => c.nomCompte),
        [comptesRows]
    );

    // Colonnes virements internes avec valueOptions dynamique
    const virementInternesColumns = useMemo(
        () => VirementInternesColumns.map(col =>
            (col.field === 'compteSource' || col.field === 'compteDestination')
                ? { ...col, valueOptions: allNonArchivedComptesOptions }
                : col
        ),
        [allNonArchivedComptesOptions]
    );

    // Colonnes frais fixes : valueOptions compte + sousCategorie + renderCell pour Mon %
    // isCellEditable retiré : params.row reflète l'état persisté (toujours '' pour une nouvelle
    // ligne), ce qui empêchait l'édition du % même après sélection du compte joint.
    const fraisFixesColumns = useMemo(() => {
        return FraisFixesColumns.map(col => {
            if (col.field === 'compte') {
                return { ...col, valueOptions: allNonArchivedComptesOptions };
            }
            if (col.field === 'sousCategorie') return makeSousCategorieColumn(
                col, categoriesRows, (row) => row?.type === 'Recette'
            );
            if (col.field === 'pourcentageMoi') {
                return {
                    ...col,
                    renderCell: (params) => {
                        if (params.row.compte !== compteJointNom) return null;
                        if (params.value == null) return '';
                        return `${Math.round(params.value)} %`;
                    },
                };
            }
            return col;
        });
    }, [allNonArchivedComptesOptions, compteJointNom, categoriesRows]);

    // onFieldChange enrichi : pré-remplit / efface pourcentageMoi selon le compte sélectionné
    const fraisFixesOnFieldChangeEnriched = useCallback((args) => {
        fraisFixesOnFieldChange(args);
        if (args.field === 'compte' && compteJointNom) {
            if (args.value === compteJointNom) {
                const current = args.getEditCellValue({ id: args.editingId, field: 'pourcentageMoi' });
                if (current == null || current === 0) {
                    args.setEditCellValue({ id: args.editingId, field: 'pourcentageMoi', value: compteJointConfig.pourcentageDefaut ?? 50 });
                }
            } else {
                args.setEditCellValue({ id: args.editingId, field: 'pourcentageMoi', value: null });
            }
        }
    }, [compteJointNom, compteJointConfig.pourcentageDefaut]);

    // Validation frais fixes : base + pourcentageMoi obligatoire sur compte joint
    const validateFraisFixeRow = useCallback((row) => {
        const errors = validateFraisFixeBaseRow(row);
        if (row.compte === compteJointNom) {
            const pct = parseFloat(row.pourcentageMoi);
            if (row.pourcentageMoi === null || row.pourcentageMoi === undefined || row.pourcentageMoi === '') {
                errors.pourcentageMoi = 'Le pourcentage est obligatoire pour un compte joint';
            } else if (isNaN(pct) || pct < 0 || pct > 100) {
                errors.pourcentageMoi = 'Le pourcentage doit être entre 0 et 100';
            }
        }
        return errors;
    }, [compteJointNom]);

    // Actions archive / désarchive pour frais fixes
    const fraisFixesExtraActions = useMemo(() => makeArchiveAction(showArchivedFraisFixes, {
        toggleFn: toggleArchiveFraisFixe,
        entityLabel: 'Frais fixe',
    }), [showArchivedFraisFixes]);

    const onSaveInvestissementHistorique = useCallback(async (row, isNew) => {
        const saved = await saveInvestissementHistorique(row, isNew);
        setInvestissementsHistoriqueRows(prev => isNew
            ? [saved, ...prev.filter(r => r.id !== row.id)]
            : prev.map(r => r.id === row.id ? saved : r)
        );
        return saved;
    }, []);

    const onDeleteConfirmInvestissementHistorique = useCallback(async (row) => {
        await deleteInvestissementHistorique(row);
        setInvestissementsHistoriqueRows(prev => prev.filter(h => h.id !== row.id));
    }, []);

    const handleLierFraisFixe = useCallback(async (investissementId, fraisFixeId) => {
        const saved = await lierFraisFixeApi(investissementId, fraisFixeId);
        setInvestissementsRows(prev => prev.map(inv => inv.id === investissementId ? { ...inv, fraisFixeRef: saved.fraisFixeRef } : inv));
    }, []);

    const onDeleteConfirmInvestissement = useCallback(async (row) => {
        await deleteInvestissement(row);
        setInvestissementsHistoriqueRows(prev => prev.filter(h => h.investissementId !== row.id));
        return 'delete';
    }, []);

    const parametrageSections = useMemo(() => {
        const sections = ['Comptes', 'Frais fixes', 'Virements internes', 'Catégories'];
        if (canInvestissement) sections.push('Investissements');
        if (compteJointData) sections.push('Compte joint');
        if (canNoteDeFrais) sections.push('Notes de frais');
        if (canRegle503020) sections.push('Règle 50-30-20');
        return sections;
    }, [canInvestissement, compteJointData, canNoteDeFrais, canRegle503020]);

    // Rows pré-filtrées par compte pour éviter les filter() inline dans le JSX
    // (chaque filter() crée une nouvelle référence → re-render inutile des StatCards)
    // On réutilise les tableaux précédents quand le contenu n'a pas changé,
    // ce qui permet à React.memo(StatCard) de sauter le re-render pour les comptes inchangés.
    const rowsByComptePrevRef = useRef({});
    const rowsByCompte = useMemo(() => {
        const newMap = {};
        rows.forEach(r => {
            if (r.isNew) return; // exclure les lignes en cours de saisie (non encore sauvegardées)
            if (!newMap[r.compte]) newMap[r.compte] = [];
            newMap[r.compte].push(r);
        });
        const prev = rowsByComptePrevRef.current;
        for (const compte of Object.keys(newMap)) {
            const newArr = newMap[compte];
            const prevArr = prev[compte];
            if (prevArr && prevArr.length === newArr.length && newArr.every((r, i) => r === prevArr[i])) {
                newMap[compte] = prevArr;
            }
        }
        rowsByComptePrevRef.current = newMap;
        return newMap;
    }, [rows]);

    // Filtre appliqué au DataGrid dépenses : masque les lignes liées à un compte archivé ou compte joint
    const depensesRowFilter = useMemo(
        () => excludedComptesNames.size > 0 ? (row) => !excludedComptesNames.has(row.compte) : null,
        [excludedComptesNames]
    );

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (loadError) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 3 }}>
                <Alert severity="error" sx={{ maxWidth: 480 }}>
                    Impossible de contacter le serveur. Vérifiez que le backend et la base de données sont démarrés, puis rechargez la page.
                </Alert>
            </Box>
        );
    }

    return (
        <>
        <Box sx={{ width: '100%' }}>

            {/* ─── StatCards + Récap (toujours visibles, même conteneur) ─────── */}
            <Box sx={{ p: 3, pb: 0 }}>
                <Box sx={statCardsContainerSx}>
                    <Box sx={{ width: '100%' }}>
                        <StatCardRecap
                            comptesData={comptesRecapData}
                            rowsByCompte={rowsByCompte}
                            virementInternesRows={virementInternesRows}
                            compteJointData={compteJointData}
                            compteJointConfig={compteJointConfig}
                            categoriesRows={categoriesRows}
                            budget503020Config={budget503020Config}
                            fraisFixesRows={fraisFixesRows}
                            showNoteDeFrais={canNoteDeFrais}
                            showRegle503020={canRegle503020}
                        />
                    </Box>
                    {comptesActifsData.map(compteData => (
                        <StatCard
                            key={compteData.nomCompte}
                            compte={compteData.nomCompte}
                            rows={rowsByCompte[compteData.nomCompte] ?? []}
                            compteData={compteData}
                            virementInternesRows={virementInternesRows}
                        />
                    ))}
                    {compteJointData && compteJointData.soldeInitial != null && (
                        <StatCardJoint
                            compte={compteJointData.nomCompte}
                            rows={rowsByCompte[compteJointData.nomCompte] ?? []}
                            compteData={compteJointData}
                            compteJointConfig={compteJointConfig}
                            virementInternesRows={virementInternesRows}
                        />
                    )}
                </Box>
            </Box>

            {/* ─── Barre d'onglets ──────────────────────────────────────────── */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { textTransform: 'none' } }}>
                    <Tab label="Tableau de bord" />
                    <Tab label="Dépenses / Recettes" />
                    <Tab label="Compte joint" sx={{ display: compteJointNom ? 'inline-flex' : 'none' }} />
                    <Tab label="Investissements" sx={{ display: canInvestissement && investissementsRows.length > 0 ? 'inline-flex' : 'none' }} />
                    <Tab label="Paramétrage" sx={{ display: (permissions === null || permissions?.finance?.admin) ? 'inline-flex' : 'none' }} />
                </Tabs>
            </Box>

            {/* ─── Tableau de bord ──────────────────────────────────────────── */}
            {tab === 0 && (
                <Box sx={{ p: 3 }}>
                    <DepensesChart rows={rows} compteJointNom={compteJointNom} pourcentageDefaut={compteJointConfig.pourcentageDefaut ?? 50} />
                </Box>
            )}

            {/* ─── Investissements ──────────────────────────────────────────── */}
            {tab === 3 && (
                <Box sx={{ p: 3 }}>
                    <InvestissementsTab
                        investissementsRows={investissementsRows}
                        historiqueRows={investissementsHistoriqueRows}
                        fraisFixesRows={fraisFixesRows}
                        categoriesRows={categoriesRows}
                        depensesRecettesRows={rows}
                        onSave={onSaveInvestissementHistorique}
                        onDeleteHistorique={onDeleteConfirmInvestissementHistorique}
                        onLierFraisFixe={handleLierFraisFixe}
                        onUpdateRetrait={onUpdateRetraitInvest}
                    />
                </Box>
            )}

            {/* ─── Dépenses / Recettes ──────────────────────────────────────── */}
            {tab === 1 && (
                <Box sx={{ p: 3 }}>
                    <FullFeaturedCrudGrid
                        columns={depensesRecettesColumns}
                        initialRows={rows}
                        addButtonLabel="Ajouter une dépense - recette"
                        fieldFocusEdit="description"
                        validateRow={validateRow}
                        messages={snackbarMessages}
                        initialSort={initialSort}
                        onFieldChange={onFieldChange}
                        onRowsChange={onRowsChangeDepRecNormal}
                        onSave={onSaveDepenseRecette}
                        onDeleteConfirm={onDeleteConfirmDepenseRecette}
                        rowFilter={depensesRowFilter}
                        extraRowDefaults={{ categorie: '', sousCategorie: '' }}
                        showImport={canImport}
                        showExport={canImport}
                        onExportClick={() => setExportDialog({ open: true, source: 'normal' })}
                    />
                </Box>
            )}

            {/* ─── Compte joint ─────────────────────────────────────────────── */}
            {tab === 2 && (
                <Box sx={{ p: 3 }}>
                    {!compteJointNom ? (
                        <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            Aucun compte joint configuré. Activez l'option « Compte joint » dans le paramétrage des comptes.
                        </Typography>
                    ) : (
                        <FullFeaturedCrudGrid
                            columns={compteJointColumns}
                            initialRows={rows}
                            addButtonLabel="Ajouter une dépense - recette"
                            fieldFocusEdit="description"
                            validateRow={validateCompteJointRow}
                            messages={compteJointMessages}
                            initialSort={compteJointInitialSort}
                            onFieldChange={compteJointOnFieldChangeBase}
                            onRowsChange={setRows}
                            onSave={onSaveDepenseRecette}
                            onDeleteConfirm={onDeleteConfirmDepenseRecette}
                            rowFilter={(row) => row.compte === compteJointNom}
                            extraRowDefaults={compteJointExtraRowDefaults}
                            showImport={canImport}
                            showExport={canImport}
                            onExportClick={() => setExportDialog({ open: true, source: 'joint' })}
                        />
                    )}
                </Box>
            )}

            {/* ─── Paramétrage ──────────────────────────────────────────────── */}
            {tab === 4 && (
                <Box sx={{ p: 3 }}>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                    {parametrageSections.map((label) => (
                        <Accordion
                            key={label}
                            disableGutters
                            elevation={0}
                            square
                            expanded={expandedSection === label}
                            onChange={(_, expanded) => {
                                setExpandedSection(expanded ? label : null);
                                if (label === 'Comptes' && expanded) setShowArchivedComptes(false);
                                if (label === 'Frais fixes' && expanded) setShowArchivedFraisFixes(false);
                            }}
                            sx={{
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '&:last-child': { borderBottom: 'none' },
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                {label}
                            </AccordionSummary>
                            <AccordionDetails sx={(label === 'Comptes' || label === 'Frais fixes' || label === 'Virements internes' || label === 'Catégories' || label === 'Notes de frais' || label === 'Investissements') ? { p: 0 } : undefined}>
                                {label === 'Frais fixes' && (
                                    <FullFeaturedCrudGrid
                                        columns={fraisFixesColumns}
                                        initialRows={fraisFixesRows}
                                        onRowsChange={setFraisFixesRows}
                                        addButtonLabel="Ajouter un frais fixe"
                                        fieldFocusEdit="description"
                                        validateRow={validateFraisFixeRow}
                                        messages={fraisFixesMessages}
                                        initialSort={fraisFixesInitialSort}
                                        extraRowDefaults={fraisFixesExtraRowDefaults}
                                        onFieldChange={fraisFixesOnFieldChangeEnriched}
                                        onSave={saveFraisFixe}
                                        onDeleteConfirm={onDeleteConfirmFraisFixe}
                                        rowDisplayField="description"
                                        extraRowActions={fraisFixesExtraActions}
                                        rowFilter={showArchivedFraisFixes ? (row) => row.archived : (row) => !row.archived}
                                        height={400}
                                        toolbarSlotEnd={
                                            <ToggleArchivedButton
                                                shown={showArchivedFraisFixes}
                                                onToggle={() => setShowArchivedFraisFixes(prev => !prev)}
                                                label="frais fixes"
                                            />
                                        }
                                    />
                                )}
                                {label === 'Notes de frais' && (
                                    <PlafondNotesFrais />
                                )}
                                {label === 'Compte joint' && (
                                    <Box sx={parametrageFormSx}>
                                        <Typography sx={formSectionTitleSx}>Nom des personnes</Typography>
                                        <Box sx={formRowSx}>
                                            <TextField
                                                label="Mon nom"
                                                size="small"
                                                value={compteJointConfig.personne1}
                                                onChange={(e) => setCompteJointConfig(prev => ({ ...prev, personne1: e.target.value }))}
                                                onBlur={async (e) => {
                                                    const v = e.target.value.trim();
                                                    if (!v || !compteJointData) return;
                                                    const formatted = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
                                                    setCompteJointConfig(prev => ({ ...prev, personne1: formatted }));
                                                    const idx = compteJointData.personneProprietaire ?? 0;
                                                    const newPersonnes = [...(compteJointData.personnes?.length >= 2 ? compteJointData.personnes : ['', ''])];
                                                    newPersonnes[idx] = formatted;
                                                    const updated = await saveCompte({ ...compteJointData, personnes: newPersonnes }, false);
                                                    setComptesRows(prev => prev.map(r => r.id === updated.id ? updated : r));
                                                }}
                                                sx={{ width: 160 }}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                            <TextField
                                                label="Autre personne"
                                                size="small"
                                                value={compteJointConfig.personne2}
                                                onChange={(e) => setCompteJointConfig(prev => ({ ...prev, personne2: e.target.value }))}
                                                onBlur={async (e) => {
                                                    const v = e.target.value.trim();
                                                    if (!v || !compteJointData) return;
                                                    const formatted = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
                                                    setCompteJointConfig(prev => ({ ...prev, personne2: formatted }));
                                                    const idx = compteJointData.personneProprietaire ?? 0;
                                                    const newPersonnes = [...(compteJointData.personnes?.length >= 2 ? compteJointData.personnes : ['', ''])];
                                                    newPersonnes[1 - idx] = formatted;
                                                    const updated = await saveCompte({ ...compteJointData, personnes: newPersonnes }, false);
                                                    setComptesRows(prev => prev.map(r => r.id === updated.id ? updated : r));
                                                }}
                                                sx={{ width: 160 }}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                        </Box>
                                        <Box sx={formRowSx}>
                                            <TextField
                                                label={`Part ${compteJointConfig.personne1 || 'moi'} — défaut (%)`}
                                                type="number"
                                                size="small"
                                                value={compteJointConfig.pourcentageDefaut}
                                                onChange={(e) => setCompteJointConfig(prev => ({
                                                    ...prev,
                                                    pourcentageDefaut: e.target.value === '' ? '' : +e.target.value,
                                                }))}
                                                onBlur={() => setCompteJointConfig(prev => {
                                                    const v = parseFloat(prev.pourcentageDefaut);
                                                    return { ...prev, pourcentageDefaut: isNaN(v) ? 50 : Math.min(100, Math.max(0, v)) };
                                                })}
                                                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 }, inputLabel: { shrink: true } }}
                                                sx={{ width: 160 }}
                                            />
                                            <Box sx={computedValueSx}>
                                                {compteJointConfig.personne2 || 'Autre'} : {Math.round(100 - (parseFloat(compteJointConfig.pourcentageDefaut) || 0))} %
                                            </Box>
                                        </Box>
                                        <Box sx={formRowSx}>
                                            <TextField
                                                label={`Part ${compteJointConfig.personne1 || 'moi'} — solde initial (%)`}
                                                type="number"
                                                size="small"
                                                value={compteJointConfig.pourcentageSoldeInitialMoi ?? ''}
                                                onChange={(e) => {
                                                    const newVal = e.target.value === '' ? null : +e.target.value;
                                                    if (compteJointConfig.pourcentageSoldeInitialMoi !== null) {
                                                        setSoldeInitialPctWarning(true);
                                                    }
                                                    setCompteJointConfig(prev => ({
                                                        ...prev,
                                                        pourcentageSoldeInitialMoi: newVal,
                                                    }));
                                                }}
                                                onBlur={() => setCompteJointConfig(prev => {
                                                    if (prev.pourcentageSoldeInitialMoi === null) return prev;
                                                    const v = parseFloat(prev.pourcentageSoldeInitialMoi);
                                                    return { ...prev, pourcentageSoldeInitialMoi: isNaN(v) ? null : Math.min(100, Math.max(0, v)) };
                                                })}
                                                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 }, inputLabel: { shrink: true } }}
                                                sx={{ width: 160 }}
                                                placeholder={`${Math.round(compteJointConfig.pourcentageDefaut || 50)} % (défaut)`}
                                            />
                                            {compteJointConfig.pourcentageSoldeInitialMoi !== null && (
                                                <Box sx={computedValueSx}>
                                                    {compteJointConfig.personne2 || 'Autre'} : {Math.round(100 - (parseFloat(compteJointConfig.pourcentageSoldeInitialMoi) || 0))} %
                                                </Box>
                                            )}
                                        </Box>
                                        {soldeInitialPctWarning && (
                                            <Alert
                                                severity="warning"
                                                onClose={() => setSoldeInitialPctWarning(false)}
                                                sx={{ fontSize: '0.8rem', py: 0.5 }}
                                            >
                                                Modifier le partage du solde initial va recalculer tous les soldes — vérifiez la cohérence avec vos données.
                                            </Alert>
                                        )}
                                    </Box>
                                )}
                                {label === 'Catégories' && (
                                    <CategoriesManager
                                        categoriesRows={categoriesRows}
                                        onRowsChange={setCategoriesRows}
                                        onSave={saveCategorie}
                                        onDeleteConfirm={onDeleteConfirmCategorie}
                                        canRegle503020={canRegle503020}
                                    />
                                )}
                                {label === 'Virements internes' && (
                                    <FullFeaturedCrudGrid
                                        columns={virementInternesColumns}
                                        initialRows={virementInternesRows}
                                        addButtonLabel="Ajouter un virement interne"
                                        fieldFocusEdit="compteSource"
                                        validateRow={validateVirementRow}
                                        messages={virementMessages}
                                        initialSort={virementInitialSort}
                                        onRowsChange={setVirementInternesRows}
                                        onSave={onSaveVirementInterne}
                                        onDeleteConfirm={onDeleteConfirmVirementInterne}
                                        rowDisplayField="compteSource"
                                        height={400}
                                    />
                                )}
                                {label === 'Comptes' && (
                                    <FullFeaturedCrudGrid
                                        columns={comptesColumnsWithJointControl}
                                        initialRows={comptesRows}
                                        onRowsChange={setComptesRows}
                                        addButtonLabel="Ajouter un compte"
                                        fieldFocusEdit="nomCompte"
                                        validateRow={validateCompteRowWithUniqueness}
                                        messages={comptesMessages}
                                        initialSort={comptesInitialSort}
                                        extraRowDefaults={comptesExtraRowDefaults}
                                        showCopy={false}
                                        rowDisplayField="nomCompte"
                                        extraRowActions={comptesExtraActions}
                                        rowFilter={showArchivedComptes ? (row) => row.archived : (row) => !row.archived}
                                        resolveDelete={resolveCompteDelete}
                                        onSave={saveCompte}
                                        onDeleteConfirm={onDeleteConfirmCompte}
                                        height={400}
                                        toolbarSlotEnd={
                                            <ToggleArchivedButton
                                                shown={showArchivedComptes}
                                                onToggle={() => setShowArchivedComptes(prev => !prev)}
                                                label="comptes"
                                            />
                                        }
                                    />
                                )}
                                {label === 'Investissements' && (
                                    <FullFeaturedCrudGrid
                                        columns={InvestissementsColumns}
                                        initialRows={investissementsRows}
                                        onRowsChange={setInvestissementsRows}
                                        addButtonLabel="Ajouter un investissement"
                                        fieldFocusEdit="nom"
                                        validateRow={validateInvestissementRow}
                                        messages={investissementsMessages}
                                        initialSort={investissementsInitialSort}
                                        extraRowDefaults={investissementsExtraRowDefaults}
                                        onSave={saveInvestissement}
                                        onDeleteConfirm={onDeleteConfirmInvestissement}
                                        rowDisplayField="nom"
                                        height={400}
                                    />
                                )}
                                {label === 'Règle 50-30-20' && (
                                    <Box sx={parametrageFormSx}>
                                        <Typography sx={formSectionTitleSx}>Période d'analyse</Typography>
                                        <Box sx={formRowSx}>
                                            <FormControl size="small" sx={{ width: 220 }}>
                                                <InputLabel shrink>Période</InputLabel>
                                                <Select
                                                    value={budget503020Config.periode}
                                                    label="Période"
                                                    onChange={e => setBudget503020Config(prev => ({ ...prev, periode: e.target.value }))}
                                                    notched
                                                >
                                                    <MenuItem value="mois">Mois en cours</MenuItem>
                                                    <MenuItem value="3mois">3 derniers mois</MenuItem>
                                                    <MenuItem value="6mois">6 derniers mois</MenuItem>
                                                    <MenuItem value="12mois">12 derniers mois</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    </Box>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                    </Box>
                </Box>
            )}

        </Box>

        <RemboursementDiscordanceDialog
            info={remboursementInfo}
            onClose={() => setRemboursementInfo(null)}
        />

        <ExportDialog
            open={exportDialog.open}
            onClose={() => setExportDialog(d => ({ ...d, open: false }))}
            source={exportDialog.source}
            rows={rows}
            fraisFixesRows={fraisFixesRows}
            virementInternesRows={virementInternesRows}
            compteJointNom={compteJointNom}
            compteJointConfig={compteJointConfig}
        />
        </>
    );
}

export default App;
