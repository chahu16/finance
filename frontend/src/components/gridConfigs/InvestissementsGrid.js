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
    sommeInitiale: 0,
    datePremierVersement: null,
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
        field: 'sommeInitiale',
        headerName: 'Somme initiale (€)',
        type: 'number',
        width: 155,
        editable: true,
        align: 'center',
        valueFormatter: formatEuro,
    },
    {
        field: 'montantInvesti',
        headerName: 'Versement mensuel (€)',
        type: 'number',
        width: 180,
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
        field: 'datePremierVersement',
        headerName: '1er versement programmé',
        type: 'date',
        width: 195,
        editable: true,
        align: 'center',
    },
];
