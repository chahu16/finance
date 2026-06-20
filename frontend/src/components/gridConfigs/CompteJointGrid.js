import { formatEuro, formatPourcent } from '../config/Config.js';
import { chequeEnCoursOnFieldChange, makeDateSortComparator } from '../utils/DataGridHelpers.js';

export const initialSort = [
    { field: 'dateDepensesRecettes', sort: 'desc' },
];

export const snackbarMessages = {
    success: 'Transaction enregistrée',
    cancel: 'Édition annulée',
};

// Règle métier identique aux dépenses/recettes : cocher "Chèque en cours" vide la date.
export const onFieldChange = (args) => {
    chequeEnCoursOnFieldChange(args);
};

// Colonnes de base — les headerName des colonnes % sont remplacés dynamiquement dans App.js
// selon les noms des personnes configurés dans le Paramétrage.
export const CompteJointColumns = [
    {
        field: 'dateDepensesRecettes',
        headerName: 'Date',
        type: 'date',
        width: 160,
        editable: true,
        align: 'center',
        isInitialFocus: true,
        sortComparator: makeDateSortComparator('description'),
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
        field: 'sousCategorie',
        headerName: 'Sous-catégorie',
        type: 'singleSelect',
        width: 200,
        editable: true,
        align: 'center',
        headerAlign: 'center',
        valueOptions: [], // injecté dynamiquement depuis App.js (toutes sous-catégories du type)
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
    {
        field: 'pourcentageMoi',
        headerName: 'Part moi (%)',   // remplacé dynamiquement
        type: 'number',
        width: 130,
        editable: true,
        align: 'center',
        valueFormatter: formatPourcent,
        csvAliases: ['parts'],
    },
    {
        field: 'pourcentageAutre',
        headerName: 'Part autre (%)', // remplacé dynamiquement
        type: 'number',
        width: 130,
        editable: false,
        align: 'center',
        valueGetter: (value, row) => (row.pourcentageMoi != null ? 100 - row.pourcentageMoi : null),
        valueFormatter: formatPourcent,
    },
];
