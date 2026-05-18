import './App.css';
import FullFeaturedCrudGrid from './components/DataGrid.jsx';
import { validateRow } from './components/utils/DepensesRecettesValidation.js';

import { DepensesRecettesColumns, initialRows } from './components/gridConfigs/DepensesRecettesGrid.js'

function App() {
  return (
    <div style={{ padding: '24px' }}>
      <h2>Dépenses / Recettes</h2>
      <FullFeaturedCrudGrid
        columns={DepensesRecettesColumns}
        initialRows={initialRows}
        addButtonLabel="Ajouter une dépense - recette"
        fieldFocusEdit="description"
        validateRow={validateRow}
      />
    </div>
  );
}

export default App;