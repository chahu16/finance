import { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import './App.css';
import FullFeaturedCrudGrid from './components/DataGrid.jsx';
import StatCard from './components/StatCard.jsx';
import { validateRow } from './components/utils/DepensesRecettesValidation.js';
import { validateRow as validateCompteRow } from './components/utils/ComptesValidation.js';
import { DepensesRecettesColumns, initialRows, snackbarMessages, initialSort, onFieldChange } from './components/gridConfigs/DepensesRecettesGrid.js';
import { ComptesColumns, initialRows as initialComptesRows, snackbarMessages as comptesMessages, initialSort as comptesInitialSort, extraRowDefaults as comptesExtraRowDefaults } from './components/gridConfigs/ComptesGrid.js';
import { statCardsContainerSx } from './styles/StatCardStyles.js';
import { addButtonStyle } from './styles/GridStyles.js';

const PARAMETRAGE_SECTIONS = [
    'Comptes',
    'Frais fixes',
    'Virements internes',
    'Paramétrage',
];

function App() {
    const [tab, setTab] = useState(0);
    const [rows, setRows] = useState(initialRows);
    const [comptesRows, setComptesRows] = useState(initialComptesRows);
    const [showArchivedComptes, setShowArchivedComptes] = useState(false);

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

    const comptesExtraActions = useMemo(() => showArchivedComptes
        ? [{
            icon: <UnarchiveIcon />,
            label: 'Désarchiver',
            onClick: (id, setRows, showSnackbar) => {
                setRows(prev => prev.map(r => r.id === id ? { ...r, archived: false } : r));
                showSnackbar('Compte désarchivé', 'success');
            },
        }]
        : [{
            icon: <ArchiveIcon />,
            label: 'Archiver',
            onClick: (id, setRows, showSnackbar) => {
                setRows(prev => prev.map(r => r.id === id ? { ...r, archived: true } : r));
                showSnackbar('Compte archivé', 'success');
            },
        }],
    [showArchivedComptes]);

    // Noms des comptes actifs (non archivés) — source de vérité pour le singleSelect
    const activeComptesOptions = useMemo(
        () => comptesRows.filter(c => !c.archived).map(c => c.nomCompte),
        [comptesRows]
    );

    // Colonnes dépenses/recettes avec valueOptions dynamique (= comptes actifs)
    const depensesRecettesColumns = useMemo(
        () => DepensesRecettesColumns.map(col =>
            col.field === 'compte' ? { ...col, valueOptions: activeComptesOptions } : col
        ),
        [activeComptesOptions]
    );

    // Noms des comptes actifs qui ont au moins une dépense / recette → StatCards
    const comptesActifs = useMemo(
        () => activeComptesOptions.filter(nom => rows.some(r => r.compte === nom)),
        [activeComptesOptions, rows]
    );

    // Filtre appliqué au DataGrid dépenses : masque les lignes liées à un compte archivé ou compte joint
    const depensesRowFilter = useMemo(() => {
        const excludedSet = new Set(
            comptesRows.filter(c => c.archived || c.compteJoint).map(c => c.nomCompte)
        );
        return excludedSet.size > 0 ? (row) => !excludedSet.has(row.compte) : null;
    }, [comptesRows]);

    return (
        <Box sx={{ width: '100%' }}>

            {/* ─── StatCards (toujours visibles) ────────────────────────────── */}
            <Box sx={{ p: 3, pb: 0 }}>
                <Box sx={statCardsContainerSx}>
                    {comptesActifs.map(compte => (
                        <StatCard
                            key={compte}
                            compte={compte}
                            rows={rows.filter(r => r.compte === compte)}
                        />
                    ))}
                </Box>
            </Box>

            {/* ─── Barre d'onglets ──────────────────────────────────────────── */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label="Tableau de bord" />
                    <Tab label="Dépenses / Recettes" />
                    <Tab label="Compte joint" />
                    <Tab label="Paramétrage" />
                </Tabs>
            </Box>

            {/* ─── Tableau de bord ──────────────────────────────────────────── */}
            {tab === 0 && (
                <Box sx={{ p: 3 }} />
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
                        onRowsChange={setRows}
                        rowFilter={depensesRowFilter}
                    />
                </Box>
            )}

            {/* ─── Compte joint ─────────────────────────────────────────────── */}
            {tab === 2 && (
                <Box sx={{ p: 3 }} />
            )}

            {/* ─── Paramétrage ──────────────────────────────────────────────── */}
            {tab === 3 && (
                <Box sx={{ p: 3 }}>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                    {PARAMETRAGE_SECTIONS.map((label) => (
                        <Accordion
                            key={label}
                            disableGutters
                            elevation={0}
                            square
                            onChange={(_, expanded) => {
                                if (label === 'Comptes' && expanded) setShowArchivedComptes(false);
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
                            <AccordionDetails sx={label === 'Comptes' ? { p: 0 } : undefined}>
                                {label === 'Comptes' && (
                                    <FullFeaturedCrudGrid
                                        columns={ComptesColumns}
                                        initialRows={comptesRows}
                                        onRowsChange={setComptesRows}
                                        addButtonLabel="Ajouter un compte"
                                        fieldFocusEdit="nomCompte"
                                        validateRow={validateCompteRow}
                                        messages={comptesMessages}
                                        initialSort={comptesInitialSort}
                                        extraRowDefaults={comptesExtraRowDefaults}
                                        showCopy={false}
                                        rowDisplayField="nomCompte"
                                        extraRowActions={comptesExtraActions}
                                        rowFilter={showArchivedComptes ? (row) => row.archived : (row) => !row.archived}
                                        resolveDelete={resolveCompteDelete}
                                        height={400}
                                        toolbarSlotEnd={
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => setShowArchivedComptes(prev => !prev)}
                                                sx={addButtonStyle}
                                            >
                                                {showArchivedComptes ? 'Masquer les comptes archivés' : 'Afficher les comptes archivés'}
                                            </Button>
                                        }
                                    />
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                    </Box>
                </Box>
            )}

        </Box>
    );
}

export default App;
