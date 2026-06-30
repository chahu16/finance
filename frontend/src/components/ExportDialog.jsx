import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import DownloadIcon from '@mui/icons-material/Download';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { deleteDialogSx } from '../styles/GridStyles.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (date) => {
    if (!date) return '';
    try { return format(new Date(date), 'dd/MM/yyyy', { locale: fr }); }
    catch { return ''; }
};

const round2 = (n) => Math.round((n ?? 0) * 100) / 100;

function inPeriod(date, mode, monthDate, dateDebut, dateFin) {
    if (!date) return false;
    const d = new Date(date);
    if (mode === 'month') {
        if (!monthDate) return false;
        return d >= startOfMonth(monthDate) && d <= endOfMonth(monthDate);
    }
    if (dateDebut) {
        const start = new Date(dateDebut);
        start.setHours(0, 0, 0, 0);
        if (d < start) return false;
    }
    if (dateFin) {
        const end = new Date(dateFin);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
    }
    return true;
}

// ─── Feuilles xlsx ────────────────────────────────────────────────────────────

function autoFitCols(ws, rows, header) {
    ws['!cols'] = header.map((h, i) => ({
        wch: Math.min(
            Math.max(String(h).length, ...rows.map(r => String(r[i] ?? '').length)) + 2,
            50
        ),
    }));
}

function buildNormalSheet(rows, compteJointNom, mode, monthDate, dateDebut, dateFin) {
    const filtered = rows
        .filter(r => r.compte !== compteJointNom && inPeriod(r.dateDepensesRecettes, mode, monthDate, dateDebut, dateFin))
        .sort((a, b) => new Date(a.dateDepensesRecettes) - new Date(b.dateDepensesRecettes));

    const header = ['Compte', 'Date', 'Description', 'Dépenses (€)', 'Recettes (€)'];
    const data = filtered.map(r => [
        r.compte ?? '',
        fmtDate(r.dateDepensesRecettes),
        r.description ?? '',
        r.depenses || 0,
        r.recettes || 0,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    autoFitCols(ws, data, header);
    return ws;
}

function buildJointSheet(rows, compteJointNom, compteJointConfig, mode, monthDate, dateDebut, dateFin) {
    const p1 = compteJointConfig?.personne1 || 'Moi';
    const p2 = compteJointConfig?.personne2 || 'Autre';
    const filtered = rows
        .filter(r => r.compte === compteJointNom && inPeriod(r.dateDepensesRecettes, mode, monthDate, dateDebut, dateFin))
        .sort((a, b) => new Date(a.dateDepensesRecettes) - new Date(b.dateDepensesRecettes));

    const header = [
        'Date', 'Description',
        `% ${p2}`, `% ${p1}`,
        'Dépenses (€)',
        `Dépenses ${p2} (€)`, `Dépenses ${p1} (€)`,
        'Recettes (€)',
        `Recettes ${p2} (€)`, `Recettes ${p1} (€)`,
    ];
    const data = filtered.map(r => {
        const pctMoi = r.pourcentageMoi ?? 50;
        const pctAutre = 100 - pctMoi;
        const dep = r.depenses || 0;
        const rec = r.recettes || 0;
        return [
            fmtDate(r.dateDepensesRecettes),
            r.description ?? '',
            `${pctAutre}%`,
            `${pctMoi}%`,
            dep,
            round2(dep * pctAutre / 100),
            round2(dep * pctMoi / 100),
            rec,
            round2(rec * pctAutre / 100),
            round2(rec * pctMoi / 100),
        ];
    });
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    autoFitCols(ws, data, header);
    return ws;
}

function buildFraisFixesSheet(fraisFixesRows) {
    const active = [...fraisFixesRows]
        .filter(r => !r.archived)
        .sort((a, b) => (a.compte ?? '').localeCompare(b.compte ?? ''));

    const header = ['Compte', 'Description', 'Type', 'Périodicité', 'Montant (€)', '% Moi'];
    const data = active.map(r => [
        r.compte ?? '',
        r.description ?? '',
        r.type ?? '',
        r.periodicite ?? '',
        r.montant || 0,
        r.pourcentageMoi ?? '',
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    autoFitCols(ws, data, header);
    return ws;
}

function buildVirementsSheet(virementInternesRows, mode, monthDate, dateDebut, dateFin) {
    const filtered = virementInternesRows
        .filter(r => inPeriod(r.dateVirement, mode, monthDate, dateDebut, dateFin))
        .sort((a, b) => new Date(a.dateVirement) - new Date(b.dateVirement));

    const header = ['Date', 'Compte source', 'Compte destination', 'Montant (€)'];
    const data = filtered.map(r => [
        fmtDate(r.dateVirement),
        r.compteSource ?? '',
        r.compteDestination ?? '',
        r.montant || 0,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    autoFitCols(ws, data, header);
    return ws;
}

// ─── Sous-composant panneau onglet ─────────────────────────────────────────────

function TabPanel({ checked, onToggle, label, info, disabled }) {
    return (
        <Box sx={{ py: 1.5 }}>
            <FormControlLabel
                control={<Checkbox checked={checked} onChange={onToggle} disabled={disabled} />}
                label={label}
            />
            <Typography variant="body2" sx={{ color: disabled ? 'text.disabled' : 'text.secondary', ml: 4 }}>
                {info}
            </Typography>
        </Box>
    );
}

// ─── Dialog principal ─────────────────────────────────────────────────────────

export default function ExportDialog({
    open,
    onClose,
    source,
    rows,
    fraisFixesRows,
    virementInternesRows,
    compteJointNom,
    compteJointConfig,
}) {
    const [tab, setTab] = useState(0);
    const [periodMode, setPeriodMode] = useState('month');
    const [monthDate, setMonthDate] = useState(() => new Date());
    const [dateDebut, setDateDebut] = useState(null);
    const [dateFin, setDateFin] = useState(null);

    const initChecked = useMemo(() => ({
        normal: source === 'normal',
        joint: source === 'joint',
        fraisFixes: false,
        virements: true,
    }), [source]);

    const [checked, setChecked] = useState(initChecked);

    React.useEffect(() => {
        if (open) {
            setChecked(initChecked);
            setTab(source === 'joint' ? 1 : 0);
        }
    }, [open, initChecked, source]);

    const toggleCheck = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

    const countNormal = useMemo(() =>
        rows.filter(r => r.compte !== compteJointNom && inPeriod(r.dateDepensesRecettes, periodMode, monthDate, dateDebut, dateFin)).length,
        [rows, compteJointNom, periodMode, monthDate, dateDebut, dateFin]
    );
    const countJoint = useMemo(() =>
        rows.filter(r => r.compte === compteJointNom && inPeriod(r.dateDepensesRecettes, periodMode, monthDate, dateDebut, dateFin)).length,
        [rows, compteJointNom, periodMode, monthDate, dateDebut, dateFin]
    );
    const countFraisFixes = useMemo(() =>
        fraisFixesRows.filter(r => !r.archived).length,
        [fraisFixesRows]
    );
    const countVirements = useMemo(() =>
        virementInternesRows.filter(r => inPeriod(r.dateVirement, periodMode, monthDate, dateDebut, dateFin)).length,
        [virementInternesRows, periodMode, monthDate, dateDebut, dateFin]
    );

    const canExport = (checked.normal || checked.joint || checked.fraisFixes || checked.virements)
        && (periodMode === 'month' ? !!monthDate : true);

    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        if (checked.normal) {
            XLSX.utils.book_append_sheet(wb, buildNormalSheet(rows, compteJointNom, periodMode, monthDate, dateDebut, dateFin), 'Compte normal');
        }
        if (checked.joint && compteJointNom) {
            XLSX.utils.book_append_sheet(wb, buildJointSheet(rows, compteJointNom, compteJointConfig, periodMode, monthDate, dateDebut, dateFin), 'Compte joint');
        }
        if (checked.fraisFixes) {
            XLSX.utils.book_append_sheet(wb, buildFraisFixesSheet(fraisFixesRows), 'Frais fixes');
        }
        if (checked.virements) {
            XLSX.utils.book_append_sheet(wb, buildVirementsSheet(virementInternesRows, periodMode, monthDate, dateDebut, dateFin), 'Virements internes');
        }
        XLSX.writeFile(wb, `finances_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        onClose();
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={deleteDialogSx} transitionDuration={0}>
                <DialogTitle>Exporter en Excel</DialogTitle>
                <DialogContent>

                    {/* ─── Période ─── */}
                    <Stack spacing={2} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Période</Typography>
                            <ToggleButtonGroup
                                value={periodMode}
                                exclusive
                                onChange={(_, v) => v && setPeriodMode(v)}
                                size="small"
                            >
                                <ToggleButton value="month" sx={{ textTransform: 'none' }}>Mois</ToggleButton>
                                <ToggleButton value="range" sx={{ textTransform: 'none' }}>Plage libre</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {periodMode === 'month' ? (
                            <DatePicker
                                label="Mois / Année"
                                views={['year', 'month']}
                                value={monthDate}
                                onChange={setMonthDate}
                                slotProps={{ textField: { size: 'small', sx: { maxWidth: 200 } } }}
                            />
                        ) : (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <DatePicker
                                    label="Du"
                                    value={dateDebut}
                                    onChange={setDateDebut}
                                    slotProps={{ textField: { size: 'small' } }}
                                />
                                <DatePicker
                                    label="Au"
                                    value={dateFin}
                                    onChange={setDateFin}
                                    minDate={dateDebut ?? undefined}
                                    slotProps={{ textField: { size: 'small' } }}
                                />
                            </Box>
                        )}
                    </Stack>

                    <Divider sx={{ mb: 1 }} />

                    {/* ─── Onglets ─── */}
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 0.5 }}>
                        <Tab label="Compte normal" sx={{ textTransform: 'none' }} />
                        <Tab label="Compte joint" sx={{ textTransform: 'none' }} />
                        <Tab label="Frais fixes" sx={{ textTransform: 'none' }} />
                        <Tab label="Virements" sx={{ textTransform: 'none' }} />
                    </Tabs>

                    {tab === 0 && (
                        <TabPanel
                            checked={checked.normal}
                            onToggle={() => toggleCheck('normal')}
                            label="Inclure le compte normal"
                            info={`${countNormal} ligne(s) sur la période sélectionnée`}
                        />
                    )}
                    {tab === 1 && (
                        <TabPanel
                            checked={checked.joint}
                            onToggle={() => toggleCheck('joint')}
                            label="Inclure le compte joint"
                            info={compteJointNom
                                ? `${countJoint} ligne(s) sur la période sélectionnée`
                                : 'Aucun compte joint configuré'}
                            disabled={!compteJointNom}
                        />
                    )}
                    {tab === 2 && (
                        <TabPanel
                            checked={checked.fraisFixes}
                            onToggle={() => toggleCheck('fraisFixes')}
                            label="Inclure les frais fixes"
                            info={`${countFraisFixes} frais fixe(s) actif(s) — snapshot complet (hors période)`}
                        />
                    )}
                    {tab === 3 && (
                        <TabPanel
                            checked={checked.virements}
                            onToggle={() => toggleCheck('virements')}
                            label="Inclure les virements internes"
                            info={`${countVirements} virement(s) sur la période sélectionnée`}
                        />
                    )}

                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} sx={{ textTransform: 'none' }}>Annuler</Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        disabled={!canExport}
                        sx={{ textTransform: 'none' }}
                    >
                        Exporter
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}
