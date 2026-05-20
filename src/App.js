import { useState } from 'react';
import Box from '@mui/material/Box';
import './App.css';
import FullFeaturedCrudGrid from './components/DataGrid.jsx';
import StatCard from './components/StatCard.jsx';
import { validateRow } from './components/utils/DepensesRecettesValidation.js';
import { DepensesRecettesColumns, initialRows, snackbarMessages, initialSort, onFieldChange, listeComptes } from './components/gridConfigs/DepensesRecettesGrid.js';
import { statCardsContainerSx } from './styles/StatCardStyles.js';

function App() {
    const [rows, setRows] = useState(initialRows);

    const comptesActifs = listeComptes.filter(compte =>
        rows.some(r => r.compte === compte)
    );

    return (
        <div style={{ padding: '24px' }}>
            <Box sx={statCardsContainerSx}>
                {comptesActifs.map(compte => (
                    <StatCard
                        key={compte}
                        compte={compte}
                        rows={rows.filter(r => r.compte === compte)}
                    />
                ))}
            </Box>
            <FullFeaturedCrudGrid
                columns={DepensesRecettesColumns}
                initialRows={initialRows}
                addButtonLabel="Ajouter une dépense - recette"
                fieldFocusEdit="description"
                validateRow={validateRow}
                messages={snackbarMessages}
                initialSort={initialSort}
                onFieldChange={onFieldChange}
                onRowsChange={setRows}
            />
        </div>
    );
}

export default App;
