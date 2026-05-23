import { formatEuro } from '../config/Config.js';

export const initialSort = [
    { field: 'compte', sort: 'asc' },
];

export const snackbarMessages = {
    success: 'Frais fixe enregistré',
    cancel: 'Édition annulée',
};

export const extraRowDefaults = {
    archived: false,
    pourcentageMoi: null,
};

// Réinitialise jourPrelevement si la périodicité passe en non-mensuel et que la valeur > 12
export const onFieldChange = ({ field, value, editingId, setEditCellValue, getEditCellValue }) => {
    if (field === 'periodicite' && value !== 'Mensuel') {
        const currentJour = getEditCellValue({ id: editingId, field: 'jourPrelevement' });
        if (currentJour > 12) {
            setEditCellValue({ id: editingId, field: 'jourPrelevement', value: 0 });
        }
    }
};

export const FraisFixesColumns = [
    {
        field: 'compte',
        headerName: 'Compte',
        type: 'singleSelect',
        width: 160,
        editable: true,
        isInitialFocus: true,
        valueOptions: [], // injecté dynamiquement depuis App.js
    },
    {
        field: 'description',
        headerName: 'Description',
        width: 230,
        editable: true,
    },
    {
        field: 'jourPrelevement',
        headerName: 'Jour ou mois de prélèvement',
        type: 'number',
        width: 205,
        editable: true,
        align: 'center',
        valueFormatter: (value) => (value != null && value > 0) ? String(value) : '',
    },
    {
        field: 'type',
        headerName: 'Type',
        type: 'singleSelect',
        width: 110,
        editable: true,
        valueOptions: ['Dépense', 'Recette'],
    },
    {
        field: 'montant',
        headerName: 'Montant',
        type: 'number',
        width: 120,
        editable: true,
        align: 'center',
        valueFormatter: formatEuro,
    },
    {
        field: 'periodicite',
        headerName: 'Périodicité',
        type: 'singleSelect',
        width: 130,
        editable: true,
        valueOptions: ['Mensuel', 'Trimestriel', 'Semestriel', 'Annuel'],
    },
    {
        field: 'pourcentageMoi',
        headerName: 'Mon %',
        type: 'number',
        width: 80,
        editable: true,
        align: 'center',
        // renderCell et isCellEditable injectés dynamiquement depuis App.js
    },
];

export const initialRows = [
    {
        id: 'ff-1',
        compte: 'Axa Banque',
        description: 'Cotisation compte AXA',
        jourPrelevement: 2,
        type: 'Dépense',
        montant: 7.50,
        periodicite: 'Mensuel',
        pourcentageMoi: null,
        archived: false,
    },
    {
        id: 'ff-2',
        compte: 'Crédit Agricole',
        description: 'Électricité EDF',
        jourPrelevement: 10,
        type: 'Dépense',
        montant: 112,
        periodicite: 'Mensuel',
        pourcentageMoi: 50,
        archived: false,
    },
    {
        id: 'ff-3',
        compte: 'Crédit Agricole',
        description: 'Assurance habitation',
        jourPrelevement: 3,
        type: 'Dépense',
        montant: 135,
        periodicite: 'Trimestriel',
        pourcentageMoi: 50,
        archived: false,
    },
];
