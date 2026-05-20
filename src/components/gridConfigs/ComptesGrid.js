const formatEuroCompte = (value) => {
    if (value == null) return '';
    return `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
};

const formatPourcent = (value) => {
    if (value == null) return '';
    return `${value} %`;
};

export const initialSort = [
    { field: 'nomCompte', sort: 'asc' },
];

export const snackbarMessages = {
    success: 'Compte enregistré',
    cancel: 'Édition annulée',
};

export const extraRowDefaults = {
    archived: false,
};

export const ComptesColumns = [
    {
        field: 'nomCompte',
        headerName: 'Compte',
        width: 200,
        editable: true,
        isInitialFocus: true,
    },
    {
        field: 'soldeInitial',
        headerName: 'Solde initial',
        type: 'number',
        width: 140,
        editable: true,
        align: 'center',
        valueFormatter: formatEuroCompte,
    },
    {
        field: 'sommeDeCote',
        headerName: 'Somme de côté',
        type: 'number',
        width: 140,
        editable: true,
        align: 'center',
        valueFormatter: formatEuroCompte,
    },
    {
        field: 'seuil',
        headerName: 'Seuil',
        type: 'number',
        width: 120,
        editable: true,
        align: 'center',
        valueFormatter: formatEuroCompte,
    },
    {
        field: 'seuilOrange',
        headerName: 'Seuil orange (%)',
        type: 'number',
        width: 150,
        editable: true,
        align: 'center',
        valueFormatter: formatPourcent,
    },
    {
        field: 'compteJoint',
        headerName: 'Compte joint',
        type: 'boolean',
        width: 120,
        editable: true,
        align: 'center',
    },
];

export const initialRows = [
    {
        id: '1',
        nomCompte: 'Crédit Agricole',
        soldeInitial: 1500,
        sommeDeCote: 300,
        seuil: 500,
        seuilOrange: 20,
        compteJoint: true,
        archived: false,
    },
    {
        id: '2',
        nomCompte: 'Axa Banque',
        soldeInitial: 800,
        sommeDeCote: 0,
        seuil: 250,
        seuilOrange: 25,
        compteJoint: false,
        archived: false,
    },
    {
        id: '3',
        nomCompte: 'Livret A',
        soldeInitial: 5000,
        sommeDeCote: 5000,
        seuil: 0,
        seuilOrange: 0,
        compteJoint: false,
        archived: false,
    },
    {
        id: '4',
        nomCompte: 'Compte épargne',
        soldeInitial: 200,
        sommeDeCote: 0,
        seuil: 100,
        seuilOrange: 30,
        compteJoint: true,
        archived: false,
    },
    // Compte archivé — ne doit PAS apparaître dans le singleSelect dépenses/recettes
    {
        id: '5',
        nomCompte: 'Ancien CCP',
        soldeInitial: 0,
        sommeDeCote: 0,
        seuil: 0,
        seuilOrange: 0,
        compteJoint: false,
        archived: true,
    },
];
