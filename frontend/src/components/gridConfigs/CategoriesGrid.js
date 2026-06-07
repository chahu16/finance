export const initialSort = [
    { field: 'type', sort: 'asc' },
    { field: 'groupe', sort: 'asc' },
    { field: 'nom', sort: 'asc' },
];

export const snackbarMessages = {
    success: 'Catégorie enregistrée',
    cancel: 'Édition annulée',
};

export const CategoriesColumns = [
    {
        field: 'type',
        headerName: 'Type',
        type: 'singleSelect',
        width: 110,
        editable: true,
        align: 'center',
        headerAlign: 'center',
        valueOptions: ['Dépense', 'Recette'],
    },
    {
        field: 'groupe',
        headerName: 'Catégorie',
        width: 220,
        editable: true,
        isInitialFocus: true,
    },
    {
        field: 'nom',
        headerName: 'Sous-catégorie',
        width: 250,
        editable: true,
    },
];
