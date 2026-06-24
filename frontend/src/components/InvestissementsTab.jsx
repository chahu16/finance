import { useMemo, useRef, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { deleteDialogSx } from '../styles/GridStyles.js';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateKey(date) {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nbMoisDepuis(dateOuverture) {
    if (!dateOuverture) return 1;
    const open = dateOuverture instanceof Date ? dateOuverture : new Date(dateOuverture);
    if (isNaN(open.getTime())) return 1;
    const now = new Date();
    let mois = (now.getFullYear() - open.getFullYear()) * 12 + (now.getMonth() - open.getMonth());
    if (now.getDate() >= open.getDate()) mois += 1;
    return Math.max(mois, 1);
}

function lastValeurAt(histByInv, invId, targetDate) {
    const history = histByInv[invId];
    if (!history || history.length === 0) return 0;
    let val = 0;
    for (const snap of history) {
        if (snap.dateKey <= targetDate) val = snap.valeur;
        else break;
    }
    return val;
}

function lastValeurAtOrNull(histByInv, invId, targetDate) {
    const history = histByInv[invId];
    if (!history || history.length === 0) return null;
    let val = null;
    for (const snap of history) {
        if (snap.dateKey <= targetDate) val = snap.valeur;
        else break;
    }
    return val;
}

function formatEuro(v) {
    if (v == null) return '—';
    return `${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function formatPct(v) {
    if (v == null || !isFinite(v)) return '—';
    return `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)} %`;
}

function formatDateFR(date) {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR');
}

const DIVISEUR_MENSUEL = { Mensuel: 1, Trimestriel: 3, Semestriel: 6, Annuel: 12 };
function getMontantMensuel(ff) {
    if (ff.montantMensuel != null) return ff.montantMensuel;
    const diviseur = DIVISEUR_MENSUEL[ff.periodicite] ?? 1;
    const facteurPct = ff.pourcentageMoi != null ? ff.pourcentageMoi / 100 : 1;
    return (parseFloat(ff.montant) || 0) / diviseur * facteurPct;
}

const COLOR = {
    vert:   { border: '#4caf50', icon: '#4caf50', text: '#2e7d32' },
    rouge:  { border: '#f44336', icon: '#f44336', text: '#c62828' },
    neutre: { border: '#9e9e9e', icon: '#9e9e9e', text: '#555' },
};

const LINE_COLORS = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c62828', '#00838f'];

function getMontantMensuelPourDate(ff, dateRef) {
    if (!ff) return 0;
    const montants = ff.montants;
    if (!montants || montants.length === 0) return getMontantMensuel(ff);
    const ref = dateRef instanceof Date ? dateRef : new Date(dateRef);
    const sorted = [...montants]
        .filter(m => !m.dateEffet || new Date(m.dateEffet) <= ref)
        .sort((a, b) => {
            if (!a.dateEffet && !b.dateEffet) return 0;
            if (!a.dateEffet) return 1;
            if (!b.dateEffet) return -1;
            return new Date(b.dateEffet) - new Date(a.dateEffet);
        });
    const entree = sorted.length > 0 ? sorted[0] : montants[montants.length - 1];
    if (entree.montantMensuel != null) return entree.montantMensuel;
    const diviseur = DIVISEUR_MENSUEL[ff.periodicite] ?? 1;
    const facteur = Array.isArray(entree.parts) && entree.parts.length > 0 ? entree.parts[0] / 100 : 1;
    return (entree.montant || 0) / diviseur * facteur;
}

function versementsIntervalle(ff, dateDebut, dateFin) {
    if (!ff) return 0;
    const dDebut = dateDebut instanceof Date ? dateDebut : new Date(dateDebut);
    const dFin = dateFin instanceof Date ? dateFin : new Date(dateFin);
    let total = 0;
    const cursor = new Date(dDebut.getFullYear(), dDebut.getMonth() + 1, 1);
    while (cursor <= dFin) {
        total += getMontantMensuelPourDate(ff, cursor);
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return total;
}

// ─── Cartes récap globales ────────────────────────────────────────────────────

function RecapCard({ label, value, colorKey }) {
    const c = COLOR[colorKey] || COLOR.neutre;
    return (
        <Box sx={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            borderLeft: `4px solid ${c.border}`,
            padding: '10px 16px',
            minWidth: 180,
            flex: '1 1 180px',
        }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#555', mb: 0.5 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.text }}>
                {value}
            </Typography>
        </Box>
    );
}

// ─── Card par investissement ─────────────────────────────────────────────────

function InvestissementCard({ inv, historiqueRows, retraits, fraisFixesFinances, onAddHistorique, onDeleteHistorique, onLierFraisFixe, onUpdateRetrait, showSnackbar }) {
    const [accordionOpen, setAccordionOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [addDate, setAddDate] = useState('');
    const [addValeur, setAddValeur] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [editValeur, setEditValeur] = useState('');
    const [editSaving, setEditSaving] = useState(false);
    const [editErrors, setEditErrors] = useState({});
    const [addErrors, setAddErrors] = useState({});
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [retraitsOpen, setRetraitsOpen] = useState(false);
    const [editingRetraitId, setEditingRetraitId] = useState(null);
    const [editBrutValeur, setEditBrutValeur] = useState('');
    const [editBrutSaving, setEditBrutSaving] = useState(false);
    const editBrutRef = useRef(null);
    const editDateContainerRef = useRef(null);
    const editDateRef = useRef(null);
    const editValeurRef = useRef(null);
    const editSaveRef = useRef(null);
    const editCancelRef = useRef(null);
    const addDateContainerRef = useRef(null);
    const addDateRef = useRef(null);
    const addValeurRef = useRef(null);
    const addSaveRef = useRef(null);
    const addCancelRef = useRef(null);
    const originalEditDateRef = useRef('');
    const originalEditValeurRef = useRef('');
    // Refs pour lecture sans stale-closure dans le handler Échap
    const editDateStateRef = useRef('');
    const editValeurStateRef = useRef('');
    editDateStateRef.current = editDate;
    editValeurStateRef.current = editValeur;

    const maxDateLimit = useMemo(() => {
        const d = new Date(); d.setHours(23, 59, 59, 999); return d;
    }, []);

    // YYYY-MM-DD (local) → Date objet minuit local
    const parseDateLocal = (str) => {
        if (!str) return null;
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    // Date objet → YYYY-MM-DD (local)
    const dateToStr = (d) => {
        if (!d || isNaN(d.getTime())) return '';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    useEffect(() => {
        if (editingId !== null && editValeurRef.current) {
            editValeurRef.current.focus();
            editValeurRef.current.select();
        }
    }, [editingId]);

    useEffect(() => {
        if (editingRetraitId !== null && editBrutRef.current) {
            editBrutRef.current.focus();
            editBrutRef.current.select();
        }
    }, [editingRetraitId]);

    const handleStartEditRetrait = (r) => {
        setEditingRetraitId(r.id);
        setEditBrutValeur(r.montantBrutRetrait != null ? String(r.montantBrutRetrait) : '');
    };

    const handleSaveBrut = async (r) => {
        const trimmed = editBrutValeur.trim();
        const v = trimmed === '' ? null : parseFloat(trimmed.replace(',', '.'));
        if (trimmed !== '' && (isNaN(v) || v < 0)) {
            showSnackbar('Montant invalide', 'error');
            return;
        }
        setEditBrutSaving(true);
        try {
            await onUpdateRetrait({ ...r, montantBrutRetrait: v }, false);
            setEditingRetraitId(null);
            setEditBrutValeur('');
            showSnackbar(v != null ? 'Montant brut mis à jour' : 'Montant brut supprimé');
        } catch (err) {
            showSnackbar(err.message || 'Erreur lors de la mise à jour', 'error');
        } finally {
            setEditBrutSaving(false);
        }
    };

    const handleCancelEditRetrait = () => {
        setEditingRetraitId(null);
        setEditBrutValeur('');
        showSnackbar('Édition annulée', 'warning');
    };

    useEffect(() => {
        if (addOpen && addDateRef.current) {
            setTimeout(() => { addDateRef.current?.focus(); }, 30);
        }
    }, [addOpen]);

    useEffect(() => {
        if (editingId === null) return;
        const onKeyDown = (e) => {
            if (e.key !== 'Escape') return;
            const activeEl = document.activeElement;
            // Valeur : comparer la valeur DOM avec l'originale (input natif, fiable)
            if (activeEl === editValeurRef.current) {
                if (editValeurStateRef.current !== originalEditValeurRef.current) {
                    e.stopPropagation(); e.preventDefault();
                    setEditValeur(originalEditValeurRef.current);
                    return;
                }
            }
            // Date : le DatePicker utilise un portail pour le calendrier.
            // Si le focus est dans le calendrier (hors container), on laisse le DatePicker
            // gérer l'Échap (fermeture du calendrier). Si le focus est dans le champ texte
            // (dans le container), on gère nous-mêmes.
            if (editDateContainerRef.current?.contains(activeEl)) {
                e.stopPropagation(); e.preventDefault();
                if (editDateStateRef.current !== originalEditDateRef.current) {
                    setEditDate(originalEditDateRef.current);
                    return;
                }
            }
            e.stopPropagation(); e.preventDefault();
            setEditingId(null);
            setEditDate('');
            setEditValeur('');
            setEditErrors({});
            showSnackbar('Édition annulée', 'warning');
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [editingId]);

    const myHistorique = useMemo(() =>
        [...historiqueRows.filter(h => h.investissementId === inv.id)]
            .sort((a, b) => {
                const da = toDateKey(a.date) ?? '';
                const db = toDateKey(b.date) ?? '';
                return db.localeCompare(da);
            }),
        [historiqueRows, inv.id]
    );

    const { montantInvestiNet, valeurActuelle, plusValue, performance } = useMemo(() => {
        const frais = parseFloat(inv.tauxFrais) || 0;
        const mois = nbMoisDepuis(inv.dateOuverture);
        const totalVerse = (parseFloat(inv.montantInvesti) || 0) * mois * (1 - frais / 100);
        const totalRetraits = retraits.reduce((s, r) => s + (r.montantBrutRetrait ?? r.recettes ?? 0), 0);
        const montantInvestiNet = Math.max(0, totalVerse - totalRetraits);
        const valeurActuelle = myHistorique.length > 0 ? (myHistorique[0].valeur ?? 0) : 0;
        const plusValue = valeurActuelle - montantInvestiNet;
        const performance = montantInvestiNet > 0 ? (plusValue / montantInvestiNet) * 100 : null;
        return { montantInvestiNet, valeurActuelle, plusValue, performance };
    }, [inv, myHistorique, retraits]);

    const linkedFF = fraisFixesFinances.find(ff => ff.id === inv.fraisFixeRef) ?? null;

    const historiqueAvecDelta = useMemo(() => {
        return myHistorique.map((h, idx) => {
            const prev = myHistorique[idx + 1];
            if (!prev) return { ...h, deltaReel: null, deltaReelPct: null };
            const deltaBrut = h.valeur - prev.valeur;
            const prevDate = prev.date instanceof Date ? prev.date : new Date(prev.date);
            const currDate = h.date instanceof Date ? h.date : new Date(h.date);
            const vers = linkedFF ? versementsIntervalle(linkedFF, prevDate, currDate) : 0;
            const rachatsInterval = retraits
                .filter(r => {
                    const rd = r.dateDepensesRecettes instanceof Date ? r.dateDepensesRecettes : new Date(r.dateDepensesRecettes);
                    return rd > prevDate && rd <= currDate;
                })
                .reduce((s, r) => s + (r.montantBrutRetrait ?? r.recettes ?? 0), 0);
            const deltaReel = deltaBrut - vers + rachatsInterval;
            const deltaReelPct = prev.valeur > 0 ? (deltaReel / prev.valeur) * 100 : null;
            return { ...h, deltaReel, deltaReelPct };
        });
    }, [myHistorique, linkedFF, retraits]);

    const hasHistorique = myHistorique.length > 0;
    const colorKey = !hasHistorique ? 'neutre' : plusValue > 0 ? 'vert' : plusValue < 0 ? 'rouge' : 'neutre';
    const c = COLOR[colorKey];
    const plusValueColor = !hasHistorique ? '#9e9e9e' : plusValue > 0 ? '#2e7d32' : plusValue < 0 ? '#c62828' : '#555';

    const validateHistorique = (date, valeur) => {
        const errors = {};
        const today = new Date(); today.setHours(23, 59, 59, 999);
        if (!date) {
            errors.date = 'La date est obligatoire';
        } else {
            const d = date instanceof Date ? date : parseDateLocal(date);
            if (!d || isNaN(d.getTime())) {
                errors.date = 'Date invalide';
            } else if (d > today) {
                errors.date = 'La date ne peut pas être dans le futur';
            }
        }
        const v = parseFloat(valeur);
        if (valeur === '' || valeur === null || valeur === undefined || String(valeur).trim() === '') {
            errors.valeur = 'La valeur est obligatoire';
        } else if (isNaN(v) || v < 0) {
            errors.valeur = 'La valeur doit être positive ou nulle';
        }
        return errors;
    };

    const handleAdd = async () => {
        const errors = validateHistorique(addDate, addValeur);
        if (Object.keys(errors).length > 0) {
            setAddErrors(errors);
            showSnackbar(Object.values(errors)[0], 'error');
            return;
        }
        setSaving(true);
        try {
            await onAddHistorique({ investissementId: inv.id, date: parseDateLocal(addDate), valeur: parseFloat(addValeur) }, true);
            setAddDate('');
            setAddValeur('');
            setAddOpen(false);
            setAddErrors({});
            showSnackbar('Valorisation ajoutée');
        } catch (err) {
            showSnackbar(err.message || 'Erreur lors de l\'ajout', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (h, e) => {
        e.stopPropagation();
        setDeleteTarget(h);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await onDeleteHistorique(deleteTarget);
            showSnackbar('Valorisation supprimée', 'info');
        } catch (err) {
            showSnackbar(err.message || 'Erreur lors de la suppression', 'error');
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleCancelDelete = () => setDeleteTarget(null);

    const handleOpenAdd = (e) => {
        e.stopPropagation();
        setAccordionOpen(true);
        setAddOpen(true);
        setAddErrors({});
    };

    const handleCopyHistorique = (h, e) => {
        e.stopPropagation();
        setEditingId(null);
        setEditDate('');
        setEditValeur('');
        setEditErrors({});
        setAddValeur(String(h.valeur));
        setAddDate('');
        setAddErrors({});
        setAddOpen(true);
        setAccordionOpen(true);
    };

    const handleStartEdit = (h) => {
        const d = h.date instanceof Date ? h.date : new Date(h.date);
        const dateStr = dateToStr(d);
        const valeurStr = String(h.valeur);
        setEditDate(dateStr);
        setEditValeur(valeurStr);
        originalEditDateRef.current = dateStr;
        originalEditValeurRef.current = valeurStr;
        setEditingId(h.id);
        setEditErrors({});
        setAddOpen(false);
        setAccordionOpen(true);
    };

    const handleEditSave = async (h) => {
        const errors = validateHistorique(editDate, editValeur);
        if (Object.keys(errors).length > 0) {
            setEditErrors(errors);
            showSnackbar(Object.values(errors)[0], 'error');
            return;
        }
        setEditSaving(true);
        try {
            await onAddHistorique({ ...h, date: parseDateLocal(editDate), valeur: parseFloat(editValeur) }, false);
            setEditingId(null);
            setEditErrors({});
            showSnackbar('Valorisation mise à jour');
        } catch (err) {
            showSnackbar(err.message || 'Erreur lors de la mise à jour', 'error');
        } finally {
            setEditSaving(false);
        }
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditDate('');
        setEditValeur('');
        setEditErrors({});
        showSnackbar('Édition annulée', 'warning');
    };

    return (
        <>
        <Dialog
            open={!!deleteTarget}
            onClose={handleCancelDelete}
            transitionDuration={0}
            sx={deleteDialogSx}
            onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleConfirmDelete(); }
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); handleCancelDelete(); }
            }}
        >
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Voulez-vous vraiment supprimer la valorisation du <strong>{formatDateFR(deleteTarget?.date)}</strong> ?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancelDelete} color="inherit">Annuler</Button>
                <Button onClick={handleConfirmDelete} color="error" variant="contained">Supprimer</Button>
            </DialogActions>
        </Dialog>
        <Box sx={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            borderLeft: `4px solid ${c.border}`,
            minWidth: 280,
            flex: '1 1 280px',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* ── En-tête ── */}
            <Box sx={{ px: '18px', pt: '14px', pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                    <ShowChartIcon sx={{ color: c.icon, fontSize: '1.1rem', mt: '2px' }} />
                    <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
                            {inv.nom}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#777' }}>
                            {inv.type}{inv.courtier ? ` · ${inv.courtier}` : ''}
                        </Typography>
                    </Box>
                </Box>

                {/* ── Métriques ── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#555' }}>Montant investi net :</Typography>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.875rem', color: '#1a1a1a' }}>{formatEuro(montantInvestiNet)}</Typography>
                        {inv.dateOuverture && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#aaa' }}>
                                depuis le {formatDateFR(inv.dateOuverture)}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#555' }}>Valeur actuelle :</Typography>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.875rem', color: '#1a1a1a' }}>
                            {hasHistorique ? formatEuro(valeurActuelle) : '—'}
                        </Typography>
                        {hasHistorique && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#aaa' }}>
                                au {formatDateFR(myHistorique[0].date)}
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ my: 1, borderColor: '#e0e0e0' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#1a1a1a' }}>Plus-value :</Typography>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: plusValueColor }}>
                        {hasHistorique ? formatEuro(plusValue) : '—'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#1a1a1a' }}>Performance :</Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: plusValueColor }}>
                        {hasHistorique ? formatPct(performance) : '—'}
                    </Typography>
                </Box>

                {/* ── Liaison frais fixe ── */}
                {fraisFixesFinances.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: '#555', mb: 0.5 }}>Versement :</Typography>
                        <FormControl size="small" fullWidth>
                            <Select
                                value={inv.fraisFixeRef || ''}
                                onChange={e => onLierFraisFixe(inv.id, e.target.value || null)}
                                displayEmpty
                                sx={{ fontSize: '0.8rem' }}
                            >
                                <MenuItem value=""><em>— Aucun —</em></MenuItem>
                                {fraisFixesFinances.map(ff => (
                                    <MenuItem key={ff.id} value={ff.id} sx={{ fontSize: '0.8rem' }}>
                                        {ff.description}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {linkedFF && (
                            <Typography sx={{ fontSize: '0.75rem', color: '#555', mt: 0.5 }}>
                                {formatEuro(getMontantMensuel(linkedFF))}/mois
                                {inv.tauxFrais > 0 && (
                                    <> · frais {inv.tauxFrais} % → net <strong>{formatEuro(getMontantMensuel(linkedFF) * (1 - inv.tauxFrais / 100))}/mois</strong></>
                                )}
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>

            {/* ── Retraits liés (accordion) ── */}
            {inv.type === 'Assurance vie' && retraits.length > 0 && (
                <Accordion
                    elevation={0}
                    disableGutters
                    expanded={retraitsOpen}
                    onChange={(_, exp) => setRetraitsOpen(exp)}
                    sx={{
                        mt: 1.5,
                        '&::before': { display: 'none' },
                        backgroundColor: 'transparent',
                        borderTop: '1px solid #e0e0e0',
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ fontSize: '1rem' }} />}
                        sx={{ px: '18px', minHeight: '36px', '& .MuiAccordionSummary-content': { my: '8px' } }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0, pr: 1 }}>
                            <Typography noWrap sx={{ fontSize: '0.8rem', color: '#555', minWidth: 0 }}>
                                Retraits ({retraits.length}) · {formatEuro(retraits.reduce((s, r) => s + (r.recettes ?? 0), 0))} net total
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: '18px', pt: 0, pb: '12px' }}>
                        {/* Headers */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pb: '4px', borderBottom: '1px solid #e0e0e0', mb: '4px' }}>
                            <Typography sx={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600, minWidth: 80, flexShrink: 0 }}>Date</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600, flex: 1 }}>Brut sorti</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600, minWidth: 80, textAlign: 'right', flexShrink: 0 }}>Net reçu</Typography>
                            <Box sx={{ width: 28, flexShrink: 0 }} />
                        </Box>
                        {retraits
                            .slice()
                            .sort((a, b) => new Date(b.dateDepensesRecettes) - new Date(a.dateDepensesRecettes))
                            .map((r) => {
                                const isEditingBrut = editingRetraitId === r.id;
                                return (
                                    <Box
                                        key={r.id}
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: 0.5,
                                            py: '4px', borderBottom: '1px solid #f0f0f0',
                                            cursor: 'default',
                                            '&:hover .retrait-edit-btn': { opacity: 1 },
                                        }}
                                        onDoubleClick={() => !isEditingBrut && handleStartEditRetrait(r)}
                                    >
                                        <Typography sx={{ fontSize: '0.78rem', color: '#777', minWidth: 80, flexShrink: 0 }}>
                                            {formatDateFR(r.dateDepensesRecettes)}
                                        </Typography>
                                        {isEditingBrut ? (
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={editBrutValeur}
                                                onChange={e => setEditBrutValeur(e.target.value)}
                                                disabled={editBrutSaving}
                                                sx={{ flex: 1 }}
                                                inputProps={{ style: { fontSize: '0.78rem', padding: '3px 6px' }, min: 0 }}
                                                inputRef={editBrutRef}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') { e.preventDefault(); handleSaveBrut(r); }
                                                    if (e.key === 'Escape') { e.preventDefault(); handleCancelEditRetrait(); }
                                                    if (e.key === 'Tab') { e.preventDefault(); handleSaveBrut(r); }
                                                }}
                                            />
                                        ) : (
                                            <Typography sx={{ fontSize: '0.78rem', color: '#555', flex: 1 }}>
                                                {r.montantBrutRetrait != null ? formatEuro(r.montantBrutRetrait) : '—'}
                                            </Typography>
                                        )}
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#c62828', minWidth: 80, textAlign: 'right', flexShrink: 0 }}>
                                            -{formatEuro(r.recettes)}
                                        </Typography>
                                        <Box sx={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                            {!isEditingBrut && (
                                                <Tooltip title="Modifier le brut sorti">
                                                    <IconButton
                                                        size="small"
                                                        className="retrait-edit-btn"
                                                        onClick={e => { e.stopPropagation(); handleStartEditRetrait(r); }}
                                                        sx={{ p: 0.25, opacity: 0, transition: 'opacity 0.15s' }}
                                                    >
                                                        <EditIcon sx={{ fontSize: '0.85rem', color: '#aaa', '&:hover': { color: '#1976d2' } }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                    </AccordionDetails>
                </Accordion>
            )}

            {/* ── Historique accordion ── */}
            <Accordion
                elevation={0}
                disableGutters
                expanded={accordionOpen}
                onChange={(_, exp) => setAccordionOpen(exp)}
                sx={{
                    mt: 1.5,
                    '&::before': { display: 'none' },
                    backgroundColor: 'transparent',
                    borderTop: '1px solid #e0e0e0',
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ fontSize: '1rem' }} />}
                    sx={{ px: '18px', minHeight: '36px', '& .MuiAccordionSummary-content': { my: '8px' } }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>
                            Valorisations ({myHistorique.length})
                        </Typography>
                        <Tooltip title="Ajouter une valorisation">
                            <IconButton size="small" onClick={handleOpenAdd} sx={{ p: 0.25 }}>
                                <AddIcon sx={{ fontSize: '1rem', color: '#1976d2' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: '18px', pt: 0, pb: '12px' }}>
                    {addOpen && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, alignItems: 'center' }}>
                            <div ref={addDateContainerRef} style={{ flex: '1 1 130px' }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                                <DatePicker
                                    value={parseDateLocal(addDate)}
                                    onChange={newValue => {
                                        setAddDate(newValue instanceof Date && !isNaN(newValue) ? dateToStr(newValue) : '');
                                        setAddErrors(prev => ({ ...prev, date: undefined }));
                                    }}
                                    maxDate={maxDateLimit}
                                    localeText={{ todayButtonLabel: "Aujourd'hui", clearButtonLabel: "Effacer", cancelButtonLabel: "Annuler" }}
                                    slotProps={{
                                        actionBar: { actions: ['today', 'clear', 'cancel'] },
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            error: !!addErrors.date,
                                            helperText: addErrors.date,
                                            inputProps: { style: { fontSize: '0.8rem' } },
                                            inputRef: addDateRef,
                                            onKeyDown: e => {
                                                if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
                                                if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); addValeurRef.current?.focus(); addValeurRef.current?.select(); }
                                            },
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                            </div>
                            <TextField
                                type="number"
                                size="small"
                                placeholder="Valeur (€)"
                                value={addValeur}
                                onChange={e => { setAddValeur(e.target.value); setAddErrors(prev => ({ ...prev, valeur: undefined })); }}
                                error={!!addErrors.valeur}
                                helperText={addErrors.valeur}
                                sx={{ flex: '1 1 90px' }}
                                inputProps={{ style: { fontSize: '0.8rem' } }}
                                inputRef={addValeurRef}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
                                    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); addSaveRef.current?.focus(); }
                                    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); addDateRef.current?.focus(); addDateRef.current?.select?.(); }
                                }}
                            />
                            <Box sx={{ display: 'flex', flexShrink: 0 }}>
                                <Tooltip title="Enregistrer">
                                    <span>
                                        <IconButton
                                            ref={addSaveRef}
                                            size="small"
                                            onClick={handleAdd}
                                            disabled={saving}
                                            sx={{ p: 0.5, color: 'primary.main' }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
                                                if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); addCancelRef.current?.focus(); }
                                                if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); addValeurRef.current?.focus(); addValeurRef.current?.select?.(); }
                                            }}
                                        >
                                            <SaveIcon sx={{ fontSize: '1rem' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Annuler">
                                    <IconButton
                                        ref={addCancelRef}
                                        size="small"
                                        onClick={() => { setAddOpen(false); setAddDate(''); setAddValeur(''); setAddErrors({}); }}
                                        sx={{ p: 0.5 }}
                                        onKeyDown={e => {
                                            if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); addDateRef.current?.focus(); addDateRef.current?.select?.(); }
                                            if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); addSaveRef.current?.focus(); }
                                        }}
                                    >
                                        <CloseIcon sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    )}
                    {myHistorique.length === 0 && !addOpen && (
                        <Typography sx={{ fontSize: '0.78rem', color: '#bbb', fontStyle: 'italic', textAlign: 'center', py: 0.5 }}>
                            Aucune valorisation enregistrée
                        </Typography>
                    )}
                    {myHistorique.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pb: '4px', borderBottom: '1px solid #e0e0e0', mb: '2px' }}>
                            <Typography sx={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600, flexShrink: 0, minWidth: 80 }}>Date</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600, flex: 1, minWidth: 0 }}>Valeur</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600, flexShrink: 1, minWidth: 68, textAlign: 'right' }}>Δ valeur</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600, flexShrink: 1, minWidth: 52, textAlign: 'right' }}>Δ %</Typography>
                            <Box sx={{ width: 68, flexShrink: 0 }} />
                        </Box>
                    )}
                    {historiqueAvecDelta.map((h, idx) => {
                        const delta = h.deltaReel;
                        const deltaPct = h.deltaReelPct;
                        const deltaColor = delta == null ? '#aaa' : delta >= 0 ? '#2e7d32' : '#c62828';
                        const isEditing = editingId === h.id;
                        return (
                            <Box
                                key={h.id}
                                sx={{
                                    py: '5px',
                                    borderBottom: idx < myHistorique.length - 1 ? '1px solid #f0f0f0' : 'none',
                                }}
                            >
                                {isEditing ? (
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                        <div ref={editDateContainerRef} style={{ flex: '1 1 130px' }}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                                            <DatePicker
                                                value={parseDateLocal(editDate)}
                                                onChange={newValue => {
                                                    setEditDate(newValue instanceof Date && !isNaN(newValue) ? dateToStr(newValue) : '');
                                                    setEditErrors(prev => ({ ...prev, date: undefined }));
                                                }}
                                                maxDate={maxDateLimit}
                                                localeText={{ todayButtonLabel: "Aujourd'hui", clearButtonLabel: "Effacer", cancelButtonLabel: "Annuler" }}
                                                slotProps={{
                                                    actionBar: { actions: ['today', 'clear', 'cancel'] },
                                                    textField: {
                                                        size: 'small',
                                                        fullWidth: true,
                                                        error: !!editErrors.date,
                                                        helperText: editErrors.date,
                                                        inputProps: { style: { fontSize: '0.8rem' } },
                                                        inputRef: editDateRef,
                                                        onKeyDown: e => {
                                                            if (e.key === 'Enter') { e.preventDefault(); handleEditSave(h); }
                                                            if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); editValeurRef.current?.focus(); editValeurRef.current?.select(); }
                                                        },
                                                    },
                                                }}
                                            />
                                        </LocalizationProvider>
                                        </div>
                                        <TextField
                                            type="number"
                                            size="small"
                                            value={editValeur}
                                            onChange={e => { setEditValeur(e.target.value); setEditErrors(prev => ({ ...prev, valeur: undefined })); }}
                                            error={!!editErrors.valeur}
                                            helperText={editErrors.valeur}
                                            sx={{ flex: '1 1 90px' }}
                                            inputProps={{ style: { fontSize: '0.8rem' } }}
                                            inputRef={editValeurRef}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') { e.preventDefault(); handleEditSave(h); }
                                                if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); editSaveRef.current?.focus(); }
                                                if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); editDateRef.current?.focus(); editDateRef.current?.select?.(); }
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', flexShrink: 0 }}>
                                            <Tooltip title="Enregistrer">
                                                <span>
                                                    <IconButton
                                                        ref={editSaveRef}
                                                        size="small"
                                                        onClick={() => handleEditSave(h)}
                                                        disabled={editSaving}
                                                        sx={{ p: 0.5, color: 'primary.main' }}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') { e.preventDefault(); handleEditSave(h); }
                                                            if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); editCancelRef.current?.focus(); }
                                                            if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); editValeurRef.current?.focus(); editValeurRef.current?.select?.(); }
                                                        }}
                                                    >
                                                        <SaveIcon sx={{ fontSize: '1rem' }} />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title="Annuler">
                                                <IconButton
                                                    ref={editCancelRef}
                                                    size="small"
                                                    onClick={handleEditCancel}
                                                    sx={{ p: 0.5 }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); editDateRef.current?.focus(); editDateRef.current?.select?.(); }
                                                        if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); editSaveRef.current?.focus(); }
                                                    }}
                                                >
                                                    <CloseIcon sx={{ fontSize: '1rem' }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', borderRadius: '4px', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                        onDoubleClick={() => handleStartEdit(h)}
                                    >
                                        <Typography sx={{ fontSize: '0.78rem', color: '#555', flexShrink: 0, minWidth: 80 }}>
                                            {formatDateFR(h.date)}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, flex: 1, minWidth: 0 }}>
                                            {formatEuro(h.valeur)}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.72rem', color: deltaColor, flexShrink: 1, minWidth: 68, textAlign: 'right' }}>
                                            {delta != null ? `${delta >= 0 ? '+' : ''}${formatEuro(delta)}` : '—'}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.72rem', color: deltaColor, flexShrink: 1, minWidth: 52, textAlign: 'right' }}>
                                            {deltaPct != null ? `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(2)} %` : '—'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexShrink: 0, width: 68 }}>
                                            <Tooltip title="Copier">
                                                <IconButton size="small" onClick={(e) => handleCopyHistorique(h, e)} sx={{ p: 0.25 }}>
                                                    <ContentCopyIcon sx={{ fontSize: '0.85rem', color: '#ccc', '&:hover': { color: '#1976d2' } }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Modifier">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleStartEdit(h); }} sx={{ p: 0.25 }}>
                                                    <EditIcon sx={{ fontSize: '0.85rem', color: '#ccc', '&:hover': { color: '#1976d2' } }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Supprimer">
                                                <IconButton size="small" onClick={(e) => handleDeleteClick(h, e)} sx={{ p: 0.25 }}>
                                                    <DeleteOutlineIcon sx={{ fontSize: '0.95rem', color: '#ccc', '&:hover': { color: '#f44336' } }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </AccordionDetails>
            </Accordion>
        </Box>
        </>
    );
}

// ─── Graphique évolution totale ───────────────────────────────────────────────

function EvolutionChart({ investissementsRows, historiqueRows }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const { labels, totals } = useMemo(() => {
        const histByInv = {};
        for (const h of historiqueRows) {
            const dk = toDateKey(h.date);
            if (!dk) continue;
            if (!histByInv[h.investissementId]) histByInv[h.investissementId] = [];
            histByInv[h.investissementId].push({ dateKey: dk, valeur: h.valeur });
        }
        for (const id in histByInv) {
            histByInv[id].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
        }
        const allDateKeys = [...new Set(historiqueRows.map(h => toDateKey(h.date)).filter(Boolean))].sort();
        const invIds = Object.keys(histByInv);
        const totals = allDateKeys.map(dk => invIds.reduce((sum, id) => sum + lastValeurAt(histByInv, id, dk), 0));
        return { labels: allDateKeys, totals };
    }, [investissementsRows, historiqueRows]);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
        if (labels.length === 0) return;
        chartRef.current = new Chart(canvasRef.current, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Valeur totale (€)',
                    data: totals,
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25,118,210,0.08)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ` ${formatEuro(ctx.parsed.y)}` } },
                },
                scales: { y: { ticks: { callback: v => `${Number(v).toLocaleString('fr-FR')} €` } } },
            },
        });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [labels, totals]);

    if (labels.length === 0) return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                Aucune valorisation enregistrée
            </Typography>
        </Box>
    );
    return <canvas ref={canvasRef} />;
}

// ─── Graphique évolution par investissement ───────────────────────────────────

function EvolutionParInvestissementChart({ investissementsRows, historiqueRows }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const { labels, datasets } = useMemo(() => {
        const histByInv = {};
        for (const h of historiqueRows) {
            const dk = toDateKey(h.date);
            if (!dk) continue;
            if (!histByInv[h.investissementId]) histByInv[h.investissementId] = [];
            histByInv[h.investissementId].push({ dateKey: dk, valeur: h.valeur });
        }
        for (const id in histByInv) {
            histByInv[id].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
        }
        const allDateKeys = [...new Set(historiqueRows.map(h => toDateKey(h.date)).filter(Boolean))].sort();
        const datasets = investissementsRows
            .filter(inv => histByInv[inv.id])
            .map((inv, idx) => {
                const color = LINE_COLORS[idx % LINE_COLORS.length];
                return {
                    label: inv.nom,
                    data: allDateKeys.map(dk => lastValeurAtOrNull(histByInv, inv.id, dk)),
                    borderColor: color,
                    backgroundColor: color + '18',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    spanGaps: false,
                };
            });
        return { labels: allDateKeys, datasets };
    }, [investissementsRows, historiqueRows]);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
        if (labels.length === 0 || datasets.length === 0) return;
        chartRef.current = new Chart(canvasRef.current, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label} : ${formatEuro(ctx.parsed.y)}` } },
                },
                scales: { y: { ticks: { callback: v => `${Number(v).toLocaleString('fr-FR')} €` } } },
            },
        });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [labels, datasets]);

    if (labels.length === 0 || datasets.length === 0) return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                Aucun historique disponible
            </Typography>
        </Box>
    );
    return <canvas ref={canvasRef} />;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function InvestissementsTab({
    investissementsRows,
    historiqueRows,
    fraisFixesRows,
    categoriesRows = [],
    depensesRecettesRows = [],
    onSave,
    onDeleteHistorique,
    onLierFraisFixe,
    onUpdateRetrait,
}) {
    const { totalInvesti, valeurTotale, plusValue, performance } = useMemo(() => {
        const lastValByInv = {};
        for (const h of historiqueRows) {
            const dk = toDateKey(h.date);
            if (!dk) continue;
            const cur = lastValByInv[h.investissementId];
            if (!cur || dk > cur.dateKey) lastValByInv[h.investissementId] = { dateKey: dk, valeur: h.valeur };
        }
        const retraitsTotauxByInv = {};
        for (const r of depensesRecettesRows) {
            if (r.investissementRef) {
                retraitsTotauxByInv[r.investissementRef] = (retraitsTotauxByInv[r.investissementRef] ?? 0) + (r.montantBrutRetrait ?? r.recettes ?? 0);
            }
        }
        let totalInvesti = 0;
        let valeurTotale = 0;
        for (const inv of investissementsRows) {
            const frais = parseFloat(inv.tauxFrais) || 0;
            const mois = nbMoisDepuis(inv.dateOuverture);
            const totalVerse = (parseFloat(inv.montantInvesti) || 0) * mois * (1 - frais / 100);
            const totalRetraits = retraitsTotauxByInv[inv.id] ?? 0;
            totalInvesti += Math.max(0, totalVerse - totalRetraits);
            valeurTotale += lastValByInv[inv.id]?.valeur ?? 0;
        }
        const plusValue = valeurTotale - totalInvesti;
        const performance = totalInvesti > 0 ? (plusValue / totalInvesti) * 100 : null;
        return { totalInvesti, valeurTotale, plusValue, performance };
    }, [investissementsRows, historiqueRows, depensesRecettesRows]);

    const epargneIds = useMemo(
        () => new Set(categoriesRows.filter(c => c.groupe === 'Finances' && c.nom === 'Épargne').map(c => c.id)),
        [categoriesRows]
    );

    const retraitsByInv = useMemo(() => {
        const map = {};
        for (const r of depensesRecettesRows) {
            if (r.investissementRef) {
                if (!map[r.investissementRef]) map[r.investissementRef] = [];
                map[r.investissementRef].push(r);
            }
        }
        return map;
    }, [depensesRecettesRows]);

    const fraisFixesFinances = useMemo(
        () => (fraisFixesRows ?? []).filter(ff => epargneIds.has(ff.sousCategorie) && !ff.archived),
        [fraisFixesRows, epargneIds]
    );

    const plusValueColorKey = valeurTotale === 0 ? 'neutre' : plusValue > 0 ? 'vert' : plusValue < 0 ? 'rouge' : 'neutre';
    const perfColorKey = performance == null ? 'neutre' : performance > 0 ? 'vert' : performance < 0 ? 'rouge' : 'neutre';

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
    const handleCloseSnackbar = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* ─── Récap global ──────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <RecapCard label="Total investi net" value={formatEuro(totalInvesti)} colorKey="neutre" />
                <RecapCard label="Valeur actuelle totale" value={formatEuro(valeurTotale)} colorKey="neutre" />
                <RecapCard label="Plus-value globale" value={formatEuro(valeurTotale > 0 ? plusValue : null)} colorKey={plusValueColorKey} />
                <RecapCard label="Performance globale" value={formatPct(performance)} colorKey={perfColorKey} />
            </Box>

            {/* ─── Cards par investissement ───────────────────────────────── */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {investissementsRows.map(inv => (
                    <InvestissementCard
                        key={inv.id}
                        inv={inv}
                        historiqueRows={historiqueRows}
                        retraits={retraitsByInv[inv.id] ?? []}
                        fraisFixesFinances={fraisFixesFinances}
                        onAddHistorique={onSave}
                        onDeleteHistorique={onDeleteHistorique}
                        onLierFraisFixe={onLierFraisFixe}
                        onUpdateRetrait={onUpdateRetrait}
                        showSnackbar={showSnackbar}
                    />
                ))}
            </Box>

            {/* ─── Graphiques ────────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Paper elevation={0} variant="outlined" sx={{ flex: 1.5, minWidth: 320, p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                        Évolution de la valeur totale
                    </Typography>
                    <Box sx={{ height: 240 }}>
                        <EvolutionChart investissementsRows={investissementsRows} historiqueRows={historiqueRows} />
                    </Box>
                </Paper>
                <Paper elevation={0} variant="outlined" sx={{ flex: 1, minWidth: 280, p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                        Évolution par investissement
                    </Typography>
                    <Box sx={{ height: 240 }}>
                        <EvolutionParInvestissementChart investissementsRows={investissementsRows} historiqueRows={historiqueRows} />
                    </Box>
                </Paper>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
