import {
    valueFormatterDepensesRecettes, formateurPourcentage, validatePourcentage
} from '../config/Config.js';

// Libellé du bouton principal
export const addButtonLabelComptes = "Ajouter un compte";

/**
 * ============================================================
 * CONFIGURATION DES COLONNES
 * ============================================================
 * Définit la structure du tableau de gestion des comptes.
 */
export const getDepensesComptesColumns = [
    {
        field: 'nom',
        headerName: 'Compte',
        width: 200,
        editable: true,
        isInitialFocus: true,
        isEditFocus: true,
        isNameField: true, // Champ principal pour l'identification
        validate: (value) => value.length > 0 || "Le nom est obligatoire",
    },
    {
        field: 'soldeInitial',
        type: 'number',
        headerName: 'Solde initial',
        width: 150,
        editable: true,
        align: 'center',
        headerAlign: 'center',
        // Utilisation du formateur sécurisé importé de la config
        valueFormatter: (value) => valueFormatterDepensesRecettes(value),
    },
    {
        field: 'sommeDeCote',
        type: 'number',
        headerName: 'Somme de côté',
        width: 150,
        editable: true,
        align: 'center',
        headerAlign: 'center',
        valueFormatter: (value) => valueFormatterDepensesRecettes(value),
    },
    {
        field: 'seuil',
        type: 'number',
        headerName: 'Seuil',
        width: 150,
        editable: true,
        align: 'center',
        headerAlign: 'center',
        valueFormatter: (value) => valueFormatterDepensesRecettes(value),
    },
    {
        field: 'seuilOrange',
        type: 'number',
        headerName: 'Seuil orange (%)',
        width: 150,
        editable: true,
        align: 'center',
        headerAlign: 'center',
        valueFormatter: formateurPourcentage,
        validate: validatePourcentage,
    },
    {
        field: 'estCompteJoint',
        type: 'boolean',
        headerName: 'Compte joint',
        width: 120,
        editable: true,
        align: 'center',
        headerAlign: 'center',
    },
];

/**
 * ============================================================
 * MESSAGES PERSONALISES
 * ============================================================
 */
export const getRowTypeLabelComptes = (row) => {
    if (!row) return "le compte";
    return <strong>le compte</strong>;
};

export const getArchivedLabelComptes = (showArchived) =>
    showArchived ? "Cacher les comptes archivés" : "Afficher les comptes archivés";

/**
 * ============================================================
 * UTILITAIRES DE FORMATAGE
 * ============================================================
 * Transforme les données brutes de MongoDB (Back-end) 
 * en format exploitable par le DataGrid (Front-end).
 */
export const formatComptesBackToFront = (e) => {
    return {
        id: e.id || e._id,
        nom: e.nom ?? "",
        soldeInitial: e.soldeInitial ?? 0,
        archive: !!e.archive,
        sommeDeCote: e.sommeDeCote ?? 0,
        seuil: e.seuil ?? 0,
        seuilOrange: e.seuilOrange ?? 0,
        estCompteJoint: !!e.estCompteJoint,
        personnes: e.personnes ?? [],
        personneProprietaire: e.personneProprietaire ?? 0,
    };
};

/**
 * ============================================================
 * LOGIQUE MÉTIER ET VALIDATION
 * ============================================================
 */

export const validateCompte = (row) => {
    const errors = {};
    if (!row.nom || row.nom.trim() === "") errors.nom = true;
    return errors;
};