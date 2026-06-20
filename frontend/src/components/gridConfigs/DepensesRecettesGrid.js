import { formatEuro } from '../config/Config.js';
import { chequeEnCoursOnFieldChange, makeDateSortComparator } from '../utils/DataGridHelpers.js';

export const initialSort = [
    { field: 'dateDepensesRecettes', sort: 'desc' },
];

// Règle métier : cocher "Chèque en cours" vide la date, et inversement.
export const onFieldChange = (args) => {
    chequeEnCoursOnFieldChange(args);
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
        notesFraisRemboursee: false,
        fraisFixe: false,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
        pourcentageMoi: 50,
    },
    {
        id: '2',
        compte: 'Crédit Agricole',
        dateDepensesRecettes: new Date('2026-05-14'),
        description: 'Courses supermarché',
        depenses: 85.50,
        recettes: 0,
        notesFraisRemboursee: false,
        fraisFixe: false,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
        pourcentageMoi: 60,
    },
    {
        id: '3',
        compte: 'Crédit Agricole',
        dateDepensesRecettes: new Date('2026-05-10'),
        description: 'Électricité EDF',
        depenses: 112,
        recettes: 0,
        notesFraisRemboursee: false,
        fraisFixe: true,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
        pourcentageMoi: 50,
    },
    {
        id: '4',
        compte: 'Crédit Agricole',
        dateDepensesRecettes: new Date('2026-05-05'),
        description: 'Restaurant client',
        depenses: 67.80,
        recettes: 0,
        notesFraisRemboursee: false,
        fraisFixe: false,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
        pourcentageMoi: 100,
    },
    // ── Axa Banque ───────────────────────────────────────────────────────────
    {
        id: '5',
        compte: 'Axa Banque',
        dateDepensesRecettes: new Date('2026-05-15'),
        description: 'Assurance voiture',
        depenses: 68.40,
        recettes: 0,
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
        notesFraisRemboursee: false,
        fraisFixe: false,
        chequeEnCours: false,
        depenseRecettesAMasquer: false,
    },
];
