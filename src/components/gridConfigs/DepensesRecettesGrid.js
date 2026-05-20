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

// valueOptions intentionnellement vide : injecté dynamiquement depuis comptesRows dans App.js
export const DepensesRecettesColumns = [
    {
        field: 'compte',
        headerName: 'Compte',
        width: 150,
        editable: true,
        type: 'singleSelect',
        valueOptions: [],
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

// ─── Jeu de données de test ───────────────────────────────────────────────────
// Couvre les 4 comptes actifs définis dans ComptesGrid.js.
// "Ancien CCP" (archivé) est volontairement absent : il ne doit pas apparaître
// dans le singleSelect et ses lignes doivent être masquées si le compte est archivé.
export const initialRows = [
    // ── Crédit Agricole ──────────────────────────────────────────────────────
    {
        id: '1',
        compte: 'Crédit Agricole',
        dateDepensesRecettes: new Date('2026-05-16'),
        description: 'Salaire mai',
        depenses: 0,
        recettes: 2800,
        noteDeFrais: false,
        notesFraisRemboursee: false,
        fraisFixe: false,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
    },
    {
        id: '2',
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
    },
    {
        id: '3',
        compte: 'Crédit Agricole',
        dateDepensesRecettes: new Date('2026-05-10'),
        description: 'Électricité EDF',
        depenses: 112,
        recettes: 0,
        noteDeFrais: false,
        notesFraisRemboursee: false,
        fraisFixe: true,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
    },
    {
        id: '4',
        compte: 'Crédit Agricole',
        dateDepensesRecettes: new Date('2026-05-05'),
        description: 'Restaurant client',
        depenses: 67.80,
        recettes: 0,
        noteDeFrais: true,
        notesFraisRemboursee: false,
        fraisFixe: false,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
    },
    // ── Axa Banque ───────────────────────────────────────────────────────────
    {
        id: '5',
        compte: 'Axa Banque',
        dateDepensesRecettes: new Date('2026-05-15'),
        description: 'Assurance voiture',
        depenses: 68.40,
        recettes: 0,
        noteDeFrais: false,
        notesFraisRemboursee: false,
        fraisFixe: true,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
    },
    {
        id: '6',
        compte: 'Axa Banque',
        dateDepensesRecettes: new Date('2026-05-03'),
        description: 'Virement depuis Crédit Agricole',
        depenses: 0,
        recettes: 200,
        noteDeFrais: false,
        notesFraisRemboursee: false,
        fraisFixe: false,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
    },
    // ── Livret A ─────────────────────────────────────────────────────────────
    {
        id: '7',
        compte: 'Livret A',
        dateDepensesRecettes: new Date('2026-05-01'),
        description: 'Épargne mensuelle',
        depenses: 0,
        recettes: 300,
        noteDeFrais: false,
        notesFraisRemboursee: false,
        fraisFixe: true,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
    },
    // ── Compte épargne ───────────────────────────────────────────────────────
    {
        id: '8',
        compte: 'Compte épargne',
        dateDepensesRecettes: new Date('2026-05-02'),
        description: 'Virement épargne projet',
        depenses: 0,
        recettes: 150,
        noteDeFrais: false,
        notesFraisRemboursee: false,
        fraisFixe: false,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
    },
];
