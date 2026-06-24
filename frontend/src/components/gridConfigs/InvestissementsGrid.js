import { formatEuro } from '../config/Config.js';

export const initialSort = [{ field: 'nom', sort: 'asc' }];

export const snackbarMessages = {
    success: 'Investissement enregistré',
    cancel: 'Édition annulée',
};

export const extraRowDefaults = {
    type: 'PEA',
    tauxFrais: 0,
    courtier: '',
    notes: '',
};

export const InvestissementsColumns = [
    {
        field: 'nom',
        headerName: 'Nom',
        width: 200,
        editable: true,
        isInitialFocus: true,
    },
    {
        field: 'type',
        headerName: 'Type',
        type: 'singleSelect',
        width: 150,
        editable: true,
        valueOptions: ['PEA', 'Assurance vie', 'Immobilier', 'Compte à terme'],
    },
    {
        field: 'courtier',
        headerName: 'Courtier / Plateforme',
        width: 180,
        editable: true,
    },
    {
        field: 'montantInvesti',
        headerName: 'Montant versé (€)',
        type: 'number',
        width: 160,
        editable: true,
        align: 'center',
        valueFormatter: formatEuro,
    },
    {
        field: 'tauxFrais',
        headerName: 'Frais (%)',
        type: 'number',
        width: 100,
        editable: true,
        align: 'center',
        valueFormatter: (value) => value != null && value !== '' ? `${value} %` : '',
    },
    {
        field: 'dateOuverture',
        headerName: 'Date ouverture',
        type: 'date',
        width: 140,
        editable: true,
        align: 'center',
    },
    {
        field: 'notes',
        headerName: 'Notes',
        flex: 1,
        editable: true,
    },
];
