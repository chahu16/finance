import { safeCurrencyFormatter } from '../config/Config.js';

// Libellé du bouton principal
export const addButtonLabelFraisFixe = "Ajouter un frais fixe";

/**
 * ============================================================
 * CONFIGURATION DES COLONNES DU DATAGRID
 * ============================================================
 */
export const getFraisFixeColumns = (listeComptes = [], compteJoint = null) => [
    {
        field: 'compte',
        headerName: 'Compte',
        width: 180,
        editable: true,
        type: 'singleSelect',
        valueOptions: listeComptes,
        isInitialFocus: true,
        validate: (value) => value?.length > 0 || "Le compte est obligatoire",
    },
    {
        field: 'description',
        headerName: 'Description',
        width: 250,
        editable: true,
        isEditFocus: true,
        isNameField: true,
        validate: (value) => value?.length > 0 || "La description est obligatoire",
    },
    {
        field: 'dateFraisFixe',
        align: 'center',
        type: 'date',
        headerName: 'Jour de prélèvement',
        width: 180,
        editable: true,
        isCopyFocus: true,
        noMaxDate: true,
        hideCalendarHeader: true,
        valueFormatter: (params) => {
            const value = params?.value !== undefined ? params.value : params;
            if (!value) return "";
            const date = new Date(value);
            return isNaN(date.getTime()) ? "" : `${date.getDate()}`;
        },
        validate: (value) => !!value || "La date est obligatoire",
    },
    {
        field: 'type',
        align: 'center',
        headerName: 'Type',
        width: 130,
        editable: true,
        type: 'singleSelect',
        valueOptions: [
            { value: 'depense', label: 'Dépense' },
            { value: 'recette', label: 'Recette' },
        ],
        validate: (value) => !!value || "Le type est obligatoire",
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
        validate: (value) => parseFloat(value) > 0 || "Le montant doit être supérieur à 0",
    },
    {
        field: 'periodicite',
        align: 'center',
        headerName: 'Périodicité',
        width: 130,
        editable: true,
        type: 'singleSelect',
        valueOptions: [
            { value: 'mensuel', label: 'Mensuel' },
        ],
    },
    ...(compteJoint ? [{
        field: 'parts_0',
        headerName: 'Mon %',
        width: 100,
        editable: true,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (value, row) => {
            if (row?.compte !== compteJoint?.nom) return null;
            return row?.parts?.[compteJoint.personneProprietaire] ?? 50;
        },
        renderCell: (params) => {
            if (params.row?.compte !== compteJoint?.nom) return "";
            const v = params.row?.parts?.[compteJoint.personneProprietaire] ?? 50;
            return `${v} %`;
        },
        valueSetter: (value, row) => {
            if (value === null || value === undefined || value === "") return { ...row, parts: row.parts ?? [50, 50] };
            const moi = Math.min(100, Math.max(0, parseFloat(value) || 0));
            const newParts = [...(row.parts ?? [50, 50])];
            newParts[compteJoint.personneProprietaire] = moi;
            newParts[1 - compteJoint.personneProprietaire] = 100 - moi;
            return { ...row, parts: newParts };
        },
        // La colonne n'est visible que si compte joint, donc on valide uniquement si la ligne est du compte joint
        validate: (value, row) => {
            if (!row || row.compte !== compteJoint?.nom) return true;
            if (value === null || value === undefined) return true;
            const v = parseFloat(value);
            if (isNaN(v) || v < 0 || v > 100) return "Entre 0 et 100";
            return true;
        },
    }] : []),
];

/**
 * ============================================================
 * MESSAGES PERSONALISES
 * ============================================================
 */
export const getRowTypeLabelFraisFixe = (row) => {
    if (!row) return "le frais fixe";
    return <strong>le frais fixe</strong>;
};

export const getArchivedLabelFraisFixes = (showArchived) =>
    showArchived ? "Cacher les frais fixes archivés" : "Afficher les frais fixes archivés";

/**
 * ============================================================
 * VALIDATION
 * ============================================================
 */
export const validateFraisFixe = (row) => {
    const errors = {};

    // Règle 1 : Compte obligatoire
    if (!row.compte || row.compte.trim() === "") {
        errors.compte = true;
    }

    // Règle 2 : Description obligatoire
    if (!row.description || row.description.trim() === "") {
        errors.description = true;
    }

    // Règle 3 : Date obligatoire
    if (!row.dateFraisFixe) {
        errors.dateFraisFixe = true;
    }

    // Règle 4 : Type obligatoire
    if (!row.type) {
        errors.type = true;
    }

    // Règle 5 : Montant obligatoire et positif
    if (!row.montant || parseFloat(row.montant) <= 0) {
        errors.montant = true;
    }

    return errors;
};

/**
 * ============================================================
 * UTILITAIRES DE FORMATAGE
 * ============================================================
 */
export const formatFraisFixeBackToFront = (e) => {
    return {
        id: e.id || e._id,
        compte: e.compte ?? "",
        dateFraisFixe: e.dateFraisFixe ? new Date(e.dateFraisFixe) : null,
        description: e.description ?? "",
        periodicite: e.periodicite ?? "mensuel",
        type: e.type ?? "",
        montant: e.montant ?? 0,
        montants: e.montants ?? [],
        parts: e.parts ?? [50, 50],
        archive: !!e.archive,
    };
};