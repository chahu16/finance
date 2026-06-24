import { formatEuro } from '../config/Config.js';

export const initialSort = [{ field: 'date', sort: 'desc' }];

export const snackbarMessages = {
    success: 'Valorisation enregistrée',
    cancel: 'Édition annulée',
};

export const InvestissementsHistoriqueColumns = [
    {
        field: 'investissementId',
        headerName: 'Investissement',
        type: 'singleSelect',
        width: 220,
        editable: true,
        isInitialFocus: true,
        valueOptions: [], // injecté dynamiquement depuis App.js
    },
    {
        field: 'date',
        headerName: 'Date',
        type: 'date',
        width: 140,
        editable: true,
        align: 'center',
    },
    {
        field: 'valeur',
        headerName: 'Valeur (€)',
        type: 'number',
        width: 150,
        editable: true,
        align: 'center',
        valueFormatter: formatEuro,
    },
];
