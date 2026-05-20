import { formatEuro } from '../config/Config.js'

export const initialSort = [
    { field: 'dateDepensesRecettes', sort: 'desc' },
];

// Règle métier : cocher "Chèque en cours" vide automatiquement la date
export const onFieldChange = ({ field, value, editingId, setEditCellValue }) => {
    if (field === 'chequeEnCours' && value === true) {
        setEditCellValue({ id: editingId, field: 'dateDepensesRecettes', value: null });
    }
    if (field === 'dateDepensesRecettes' && value != null) {
        setEditCellValue({ id: editingId, field: 'chequeEnCours', value: false });
    }
};

export const snackbarMessages = {
    success: 'Dépense / recette enregistrée',
    cancel: 'Édition annulée',
};

export const listeComptes = ['Crédit Agricole', 'Axa Banque'];

export const DepensesRecettesColumns = [
    {
        field: 'compte',
        headerName: 'Compte',
        width: 150,
        editable: true,
        type: 'singleSelect',
        valueOptions: listeComptes,
        isInitialFocus: true,
    },
    {
        field: 'dateDepensesRecettes',
        headerName: 'Date',
        type: 'date',
        width: 160,
        editable: true,
        align: 'center',
        sortComparator: (v1, v2, p1, p2) => {
            const d1 = v1 ? new Date(v1).getTime() : Infinity;
            const d2 = v2 ? new Date(v2).getTime() : Infinity;
            if (d1 !== d2) return d1 - d2;
            const desc1 = (p1.api.getRow(p1.id)?.description ?? '').toLowerCase();
            const desc2 = (p2.api.getRow(p2.id)?.description ?? '').toLowerCase();
            const cmp = desc1.localeCompare(desc2, 'fr');
            // Compenser l'inversion de direction pour garder description toujours asc
            const dir = p1.api.getSortModel()[0]?.sort ?? 'asc';
            return dir === 'desc' ? -cmp : cmp;
        },
    },
    {
        field: 'description',
        headerName: 'Description',
        width: 250,
        editable: true,
    },
    {
        field: 'depenses',
        headerName: 'Dépenses',
        type: 'number',
        width: 120,
        editable: true,
        align: 'center',
        valueFormatter: formatEuro,
    },
    {
        field: 'recettes',
        headerName: 'Recettes',
        type: 'number',
        width: 120,
        editable: true,
        align: 'center',
        valueFormatter: formatEuro,
    },
    {
        field: 'noteDeFrais',
        headerName: 'Note de frais',
        type: 'boolean',
        width: 120,
        editable: true,
        align: 'center',
    },
    {
        field: 'notesFraisRemboursee',
        headerName: 'Remboursée',
        type: 'boolean',
        width: 120,
        editable: true,
        align: 'center',
    },
    {
        field: 'fraisFixe',
        headerName: 'Frais fixe',
        type: 'boolean',
        width: 100,
        editable: true,
        align: 'center',
    },
    {
        field: 'chequeEnCours',
        headerName: 'Chèque en cours',
        type: 'boolean',
        width: 130,
        editable: true,
        align: 'center',
    },
    {
        field: 'depenseRecettesAMasquer',
        headerName: 'À masquer',
        type: 'boolean',
        width: 100,
        editable: true,
        align: 'center',
    },
];

export const initialRows = [
    {
        id: '1',
        compte: 'Crédit Agricole',
        dateDepensesRecettes: new Date('2026-05-14'),
        description: 'Courses supermarché',
        depenses: 85.50,
        recettes: 0,
        noteDeFrais: false,
        notesFraisRemboursee: false,
        fraisFixe: false,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
    }
];