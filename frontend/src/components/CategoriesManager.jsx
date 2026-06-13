import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

const BUCKET_OPTIONS = [
    { value: 'besoins', label: 'Besoins' },
    { value: 'envies', label: 'Envies' },
    { value: null, label: '—' },
];
const AUTO_GROUPES = ['Revenues', 'Épargne'];

// ─── GroupCard ─────────────────────────────────────────────────────────────────
function GroupCard({ groupe, type, subcategories, existingGroups, onAddSub, onDeleteRequest, onRenameSub, onRenameGroup, onChangeBucket, locked }) {
    // ── Ajout sous-catégorie ────────────────────────────────────────────────────
    const [adding, setAdding] = React.useState(false);
    const [newName, setNewName] = React.useState('');
    const [addError, setAddError] = React.useState('');

    const handleAdd = () => {
        const trimmed = newName.trim();
        if (!trimmed) { setAddError('Nom requis'); return; }
        if (subcategories.some(s => s.nom.toLowerCase() === trimmed.toLowerCase())) {
            setAddError('Existe déjà'); return;
        }
        onAddSub(groupe, type, trimmed);
        setNewName(''); setAdding(false); setAddError('');
    };

    // ── Renommage groupe ────────────────────────────────────────────────────────
    const [editingGroup, setEditingGroup] = React.useState(false);
    const [groupValue, setGroupValue] = React.useState(groupe);
    const [groupError, setGroupError] = React.useState('');

    const commitGroupRename = () => {
        const trimmed = groupValue.trim();
        if (!trimmed) { setGroupValue(groupe); setEditingGroup(false); setGroupError(''); return; }
        if (trimmed === groupe) { setEditingGroup(false); setGroupError(''); return; }
        const otherGroups = existingGroups.filter(g => g !== groupe);
        if (otherGroups.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
            setGroupError('Groupe existant'); return;
        }
        setEditingGroup(false); setGroupError('');
        onRenameGroup(groupe, trimmed, type);
    };

    // Sync groupValue si la prop groupe change (après sauvegarde)
    React.useEffect(() => {
        if (!editingGroup) setGroupValue(groupe);
    }, [groupe, editingGroup]);

    // ── Renommage sous-catégorie ────────────────────────────────────────────────
    const [editingSub, setEditingSub] = React.useState(null); // id du chip en édition
    const [subValue, setSubValue] = React.useState('');
    const [subError, setSubError] = React.useState('');

    const startEditSub = (sub) => {
        setEditingSub(sub.id);
        setSubValue(sub.nom);
        setSubError('');
    };

    const commitSubRename = (sub) => {
        const trimmed = subValue.trim();
        setEditingSub(null); setSubError('');
        if (!trimmed || trimmed === sub.nom) return;
        if (subcategories.some(s => s.id !== sub.id && s.nom.toLowerCase() === trimmed.toLowerCase())) {
            // doublon silencieux : on annule sans sauvegarder
            return;
        }
        onRenameSub(sub, trimmed);
    };

    return (
        <Card variant="outlined" sx={{ flex: '1 1 190px', maxWidth: 270 }}>
            <CardContent sx={{ pb: '12px !important', pt: 1.5, px: 1.5 }}>

                {/* ── Titre du groupe ── */}
                {!locked && editingGroup ? (
                    <TextField
                        autoFocus
                        size="small"
                        variant="standard"
                        value={groupValue}
                        onChange={e => { setGroupValue(e.target.value); setGroupError(''); }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') commitGroupRename();
                            if (e.key === 'Escape') {
                                setGroupValue(groupe); setEditingGroup(false); setGroupError('');
                            }
                        }}
                        onBlur={commitGroupRename}
                        error={!!groupError}
                        helperText={groupError}
                        sx={{ mb: 1, '& input': { fontWeight: 600, fontSize: '0.875rem' } }}
                    />
                ) : locked ? (
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        {groupe}
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            display: 'flex', alignItems: 'center', mb: 1, cursor: 'pointer',
                            '&:hover .edit-hint': { opacity: 1 },
                        }}
                        onClick={() => setEditingGroup(true)}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {groupe}
                        </Typography>
                        <EditIcon
                            className="edit-hint"
                            sx={{ ml: 0.5, fontSize: '0.8rem', color: 'text.disabled', opacity: 0, transition: 'opacity .15s' }}
                        />
                    </Box>
                )}

                {/* ── Bucket 50/30/20 ── */}
                {!AUTO_GROUPES.includes(groupe) && type === 'Dépense' && (
                    <FormControl size="small" sx={{ mb: 1 }}>
                        <Select
                            value={subcategories[0]?.bucket ?? null}
                            onChange={e => onChangeBucket(groupe, type, e.target.value === '' ? null : e.target.value)}
                            displayEmpty
                            sx={{ fontSize: '0.75rem', height: 24, '& .MuiSelect-select': { py: 0, px: 1 } }}
                            renderValue={v => {
                                const opt = BUCKET_OPTIONS.find(o => o.value === v);
                                return <Typography sx={{ fontSize: '0.75rem', color: v ? 'text.primary' : 'text.disabled' }}>{opt?.label ?? '—'}</Typography>;
                            }}
                        >
                            {BUCKET_OPTIONS.map(opt => (
                                <MenuItem key={String(opt.value)} value={opt.value ?? ''} sx={{ fontSize: '0.8rem' }}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* ── Chips sous-catégories ── */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {subcategories.map(sub => (
                        editingSub === sub.id ? (
                            <TextField
                                key={sub.id}
                                autoFocus
                                size="small"
                                value={subValue}
                                onChange={e => { setSubValue(e.target.value); setSubError(''); }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') commitSubRename(sub);
                                    if (e.key === 'Escape') { setEditingSub(null); setSubError(''); }
                                }}
                                onBlur={() => commitSubRename(sub)}
                                error={!!subError}
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: '12px', height: 24 },
                                    '& .MuiOutlinedInput-input': { py: 0, px: 1, fontSize: '0.8125rem' },
                                    width: Math.max(80, subValue.length * 8 + 24),
                                }}
                            />
                        ) : (
                            <Chip
                                key={sub.id}
                                label={sub.nom}
                                size="small"
                                onClick={() => startEditSub(sub)}
                                onDelete={() => onDeleteRequest(sub)}
                                sx={{ cursor: 'text' }}
                            />
                        )
                    ))}

                    {/* ── Ajout inline ── */}
                    {adding ? (
                        <TextField
                            autoFocus
                            size="small"
                            variant="outlined"
                            placeholder="Sous-catégorie"
                            value={newName}
                            onChange={e => { setNewName(e.target.value); setAddError(''); }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleAdd();
                                if (e.key === 'Escape') { setAdding(false); setNewName(''); setAddError(''); }
                            }}
                            onBlur={() => { if (!newName.trim()) { setAdding(false); setAddError(''); } }}
                            error={!!addError}
                            helperText={addError}
                            sx={{ width: '100%', mt: 0.5 }}
                            inputProps={{ sx: { py: 0.5, px: 1, fontSize: '0.8125rem' } }}
                        />
                    ) : (
                        <Chip
                            label="+ ajouter"
                            size="small"
                            variant="outlined"
                            onClick={() => setAdding(true)}
                            sx={{ cursor: 'pointer', borderStyle: 'dashed' }}
                        />
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

// ─── NewGroupForm ──────────────────────────────────────────────────────────────
function NewGroupForm({ type, existingGroups, onAdd, onCancel }) {
    const [groupe, setGroupe] = React.useState('');
    const [nom, setNom] = React.useState('');
    const [errors, setErrors] = React.useState({});
    const nomRef = React.useRef(null);

    const validate = () => {
        const e = {};
        if (!groupe.trim()) e.groupe = 'Requis';
        else if (existingGroups.some(g => g.toLowerCase() === groupe.trim().toLowerCase())) {
            e.groupe = 'Groupe existant';
        }
        if (!nom.trim()) e.nom = 'Requis';
        return e;
    };

    const handleAdd = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        onAdd(groupe.trim(), type, nom.trim());
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap', mt: 1 }}>
            <TextField
                autoFocus
                size="small"
                label="Nouveau groupe"
                value={groupe}
                onChange={e => { setGroupe(e.target.value); setErrors(p => ({ ...p, groupe: '' })); }}
                onKeyDown={e => {
                    if (e.key === 'Enter') nomRef.current?.focus();
                    if (e.key === 'Escape') onCancel();
                }}
                error={!!errors.groupe}
                helperText={errors.groupe}
                sx={{ width: 170 }}
            />
            <TextField
                inputRef={nomRef}
                size="small"
                label="1re sous-catégorie"
                value={nom}
                onChange={e => { setNom(e.target.value); setErrors(p => ({ ...p, nom: '' })); }}
                onKeyDown={e => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') onCancel();
                }}
                error={!!errors.nom}
                helperText={errors.nom}
                sx={{ width: 170 }}
            />
            <Box sx={{ display: 'flex', gap: 0.5, pt: 0.5 }}>
                <Button size="small" variant="contained" onClick={handleAdd}>Créer</Button>
                <Button size="small" onClick={onCancel}>Annuler</Button>
            </Box>
        </Box>
    );
}

// ─── TypeSection ───────────────────────────────────────────────────────────────
function TypeSection({ type, categoriesRows, onAddSub, onDeleteRequest, onRenameSub, onRenameGroup, onChangeBucket }) {
    const [addingGroup, setAddingGroup] = React.useState(false);

    const groupEntries = React.useMemo(() => {
        const filtered = categoriesRows.filter(c => c.type === type);
        const map = {};
        for (const c of filtered) {
            if (!map[c.groupe]) map[c.groupe] = [];
            map[c.groupe].push(c);
        }
        return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'fr'));
    }, [categoriesRows, type]);

    const existingGroups = groupEntries.map(([g]) => g);

    return (
        <Box>
            <Typography
                variant="overline"
                sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.1em', display: 'block', mb: 1 }}
            >
                {type === 'Dépense' ? 'Dépenses' : 'Recettes'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {groupEntries.map(([groupe, subs]) => (
                    <GroupCard
                        key={groupe}
                        groupe={groupe}
                        type={type}
                        subcategories={subs}
                        existingGroups={existingGroups}
                        onAddSub={onAddSub}
                        onDeleteRequest={onDeleteRequest}
                        onRenameSub={onRenameSub}
                        onRenameGroup={onRenameGroup}
                        onChangeBucket={onChangeBucket}
                        locked={groupe === 'Revenues'}
                    />
                ))}
            </Box>
            {addingGroup ? (
                <NewGroupForm
                    type={type}
                    existingGroups={existingGroups}
                    onAdd={(g, t, n) => { onAddSub(g, t, n); setAddingGroup(false); }}
                    onCancel={() => setAddingGroup(false)}
                />
            ) : (
                <Button size="small" startIcon={<AddIcon />} onClick={() => setAddingGroup(true)} sx={{ mt: 1 }}>
                    Nouveau groupe
                </Button>
            )}
        </Box>
    );
}

// ─── CategoriesManager ─────────────────────────────────────────────────────────
export function CategoriesManager({ categoriesRows, onRowsChange, onSave, onDeleteConfirm }) {
    const [deleteTarget, setDeleteTarget] = React.useState(null);
    const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

    const showSnackbar = (message, severity = 'success') =>
        setSnackbar({ open: true, message, severity });

    const handleAddSub = async (groupe, type, nom) => {
        try {
            const saved = await onSave({ groupe, type, nom }, true);
            onRowsChange(prev => [...prev, saved]);
            showSnackbar(`"${nom}" ajoutée dans ${groupe}`);
        } catch (err) {
            showSnackbar(err.message || "Erreur lors de l'ajout", 'error');
        }
    };

    const handleRenameSub = async (sub, newNom) => {
        try {
            const saved = await onSave({ ...sub, nom: newNom }, false);
            onRowsChange(prev => prev.map(r => r.id === sub.id ? saved : r));
            showSnackbar(`Renommée en "${newNom}"`);
        } catch (err) {
            showSnackbar(err.message || 'Erreur lors du renommage', 'error');
        }
    };

    const handleChangeBucket = async (groupe, type, bucket) => {
        const subsToUpdate = categoriesRows.filter(c => c.groupe === groupe && c.type === type);
        try {
            const saved = await Promise.all(
                subsToUpdate.map(sub => onSave({ ...sub, bucket }, false))
            );
            const savedMap = Object.fromEntries(saved.map(s => [s.id, s]));
            onRowsChange(prev => prev.map(r => savedMap[r.id] ?? r));
            showSnackbar(`Bucket mis à jour pour "${groupe}"`);
        } catch (err) {
            showSnackbar(err.message || 'Erreur lors de la mise à jour', 'error');
        }
    };

    const handleRenameGroup = async (oldGroupe, newGroupe, type) => {
        const subsToUpdate = categoriesRows.filter(c => c.groupe === oldGroupe && c.type === type);
        try {
            const saved = await Promise.all(
                subsToUpdate.map(sub => onSave({ ...sub, groupe: newGroupe }, false))
            );
            const savedMap = Object.fromEntries(saved.map(s => [s.id, s]));
            onRowsChange(prev => prev.map(r => savedMap[r.id] ?? r));
            showSnackbar(`Groupe renommé en "${newGroupe}"`);
        } catch (err) {
            showSnackbar(err.message || 'Erreur lors du renommage', 'error');
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            await onDeleteConfirm(deleteTarget);
            onRowsChange(prev => prev.filter(r => r.id !== deleteTarget.id));
            showSnackbar(`"${deleteTarget.nom}" supprimée`);
        } catch (err) {
            showSnackbar(err.message || 'Erreur lors de la suppression', 'error');
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TypeSection
                type="Dépense"
                categoriesRows={categoriesRows}
                onAddSub={handleAddSub}
                onDeleteRequest={setDeleteTarget}
                onRenameSub={handleRenameSub}
                onRenameGroup={handleRenameGroup}
                onChangeBucket={handleChangeBucket}
            />
            <TypeSection
                type="Recette"
                categoriesRows={categoriesRows}
                onAddSub={handleAddSub}
                onDeleteRequest={setDeleteTarget}
                onRenameSub={handleRenameSub}
                onRenameGroup={handleRenameGroup}
                onChangeBucket={handleChangeBucket}
            />

            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} transitionDuration={0} maxWidth="xs" fullWidth>
                <DialogTitle>Supprimer la sous-catégorie ?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <strong>{deleteTarget?.nom}</strong> ({deleteTarget?.groupe}) sera définitivement supprimée.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
