import { safeCurrencyFormatter, safeDateFormatter } from '../config/Config.js';

// Libellé du bouton principal
export const addButtonLabelVirementInterne = "Ajouter un virement interne";

/**
 * ============================================================
 * CONFIGURATION DES COLONNES DU DATAGRID
 * ============================================================
 */
export const getVirementInterneColumns = (listeComptes = []) => [
    {
        field: 'compteSource',
        headerName: 'Compte source',
        width: 200,
        editable: true,
        type: 'singleSelect',
        valueOptions: listeComptes,
        isInitialFocus: true,
        isNameField: true,
        validate: (value) => value?.length > 0 || "Le compte source est obligatoire",
    },
    {
        field: 'compteDestination',
        headerName: 'Compte destination',
        width: 200,
        editable: true,
        type: 'singleSelect',
        valueOptions: listeComptes,
        isEditFocus: true,
        validate: (value) => value?.length > 0 || "Le compte destination est obligatoire",
    },
    {
        field: 'montant',
        type: 'number',
        headerName: 'Montant',
        width: 150,
        editable: true,
        align: 'center',
        headerAlign: 'right',
        valueFormatter: safeCurrencyFormatter,
        validate: (value) => (parseFloat(value) > 0) || "Le montant doit être supérieur à 0",
    },
    {
        field: 'dateVirement',
        type: 'date',
        headerName: 'Date',
        width: 152,
        editable: true,
        align: 'center',
        isCopyFocus: true,
        valueFormatter: safeDateFormatter,
    },
];

/**
 * ============================================================
 * MESSAGES D'ALERTE
 * ============================================================
 */
export const getRowTypeLabelVirementInterne = (row) => {
    if (!row) return "le virement";
    return <strong>le virement interne</strong>;
};

/**
 * ============================================================
 * VALIDATION
 * ============================================================
 */
export const validateVirementInterne = (row) => {
    const errors = {};

    // Règle 1 : Compte source obligatoire
    if (!row.compteSource || row.compteSource.trim() === "") {
        errors.compteSource = true;
    }

    // Règle 2 : Compte destination obligatoire
    if (!row.compteDestination || row.compteDestination.trim() === "") {
        errors.compteDestination = true;
    }

    // Règle 3 : Source et destination doivent être différents
    if (row.compteSource && row.compteDestination && row.compteSource === row.compteDestination) {
        errors.compteSource = true;
        errors.compteDestination = true;
    }

    // Règle 4 : Montant obligatoire et positif
    if (!row.montant || parseFloat(row.montant) <= 0) {
        errors.montant = true;
    }

    // Règle 5 : Date obligatoire
    if (!row.dateVirement) {
        errors.dateVirement = true;
    }

    return errors;
};

/**
 * ============================================================
 * UTILITAIRES DE FORMATAGE
 * ============================================================
 */
export const formatVirementBackToFront = (e) => {
    return {
        id: e.id || e._id,
        compteSource: e.compteSource ?? "",
        compteDestination: e.compteDestination ?? "",
        montant: e.montant ?? 0,
        dateVirement: e.dateVirement ? new Date(e.dateVirement) : null,
        virementInterne: true,
    };
};