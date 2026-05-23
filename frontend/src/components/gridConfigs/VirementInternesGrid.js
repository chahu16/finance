import { formatEuro } from '../config/Config.js';
import { makeDateSortComparator } from '../utils/DataGridHelpers.js';

export const initialSort = [
    { field: 'dateVirement', sort: 'desc' },
];

export const snackbarMessages = {
    success: 'Virement enregistré',
    cancel: 'Édition annulée',
};

export const VirementInternesColumns = [
    {
        field: 'compteSource',
        headerName: 'Compte source',
        type: 'singleSelect',
        width: 200,
        editable: true,
        isInitialFocus: true,
        valueOptions: [], // injecté dans App.js
    },
    {
        field: 'compteDestination',
        headerName: 'Compte destination',
        type: 'singleSelect',
        width: 200,
        editable: true,
        valueOptions: [], // injecté dans App.js
    },
    {
        field: 'montant',
        headerName: 'Montant',
        type: 'number',
        width: 140,
        editable: true,
        align: 'center',
        valueFormatter: formatEuro,
    },
    {
        field: 'dateVirement',
        headerName: 'Date',
        type: 'date',
        width: 160,
        editable: true,
        align: 'center',
        sortComparator: makeDateSortComparator('compteSource'),
    },
];

// Jeu de test : 3 virements entre comptes existants sur mai 2026
export const initialRows = [
    {
        id: 'vi-1',
        compteSource: 'Crédit Agricole',
        compteDestination: 'Livret A',
        montant: 500,
        dateVirement: new Date(2026, 4, 2), // 02/05/2026
    },
    {
        id: 'vi-2',
        compteSource: 'Axa Banque',
        compteDestination: 'Compte épargne',
        montant: 100,
        dateVirement: new Date(2026, 4, 10), // 10/05/2026
    },
    {
        id: 'vi-3',
        compteSource: 'Livret A',
        compteDestination: 'Crédit Agricole',
        montant: 200,
        dateVirement: new Date(2026, 4, 18), // 18/05/2026
    },
];
