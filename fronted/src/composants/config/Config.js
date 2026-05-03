import dayjs from 'dayjs';

/**
 * ============================================================
 * CONFIGURATION DU FORMATAGE MONÉTAIRE (EURO)
 * ============================================================
 * Instance réutilisable pour garantir que tous les prix 
 * suivent la même norme (ex: 1 234,56 €).
 */
const euroFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
});

/**
 * ============================================================
 * FORMATEURS DE %
 * ============================================================
 */

export const formateurPourcentage = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const v = parseFloat(value);
    if (isNaN(v)) return "";
    return `${Math.round(v)} %`;
};

export const validatePourcentage = (value) => {
    if (value === null || value === undefined || value === "" || value === 0) return true;
    const v = parseFloat(value);
    if (isNaN(v)) return "Valeur invalide";
    if (v < 0 || v > 100) return "Doit être entre 0 et 100";
    return true;
};

/**
 * ============================================================
 * FORMATEURS DE DATES
 * ============================================================
 */

/**
 * Formate une date au format français (DD/MM/YYYY).
 * Gère aussi bien les valeurs directes que les objets 'params' du DataGrid.
 */
export const safeDateFormatter = (params) => {
    // Extraction de la valeur selon la provenance (Grid ou appel direct)
    const value = params?.value !== undefined ? params.value : params;

    if (!value) return "";

    try {
        const date = dayjs(value);
        // On ne retourne la date que si elle est techniquement valide
        return date.isValid() ? date.format('DD/MM/YYYY') : "";
    } catch (e) {
        console.error("Erreur safeDateFormatter:", e);
        return "";
    }
};

/**
 * ============================================================
 * FORMATEURS MONÉTAIRES SÉCURISÉS
 * ============================================================
 */

/**
 * FORMATEUR POUR STATCARDS :
 * Affiche systématiquement un montant, même si la valeur est nulle ou invalide.
 * (Crucial pour éviter les "trous" visuels dans les cartes de stats).
 */
export const valueFormatterDepensesRecettes = (value) => {
    // Conversion forcée en nombre
    const num = Number(value);

    // Sécurité : si la valeur est absente ou n'est pas un nombre, on force l'affichage de "0,00 €"
    if (value === null || value === undefined || isNaN(num)) {
        return euroFormatter.format(0);
    }

    return euroFormatter.format(num);
};

/**
 * FORMATEUR POUR LA GRILLE (DATAGRID) :
 * Plus discret que celui des StatCards.
 * Masque les zéros et les cases vides pour ne pas surcharger le tableau.
 */
export const safeCurrencyFormatter = (params) => {
    // Extraction de la valeur compatible MUI
    const value = params?.value !== undefined ? params.value : params;

    // Règle de clarté : si c'est vide ou égal à zéro, on n'affiche rien dans la cellule
    if (value == null || value === '' || Number(value) === 0) return '';

    try {
        const val = Number(value);
        // Vérification que le nombre est fini et valide
        if (isNaN(val) || !isFinite(val)) return '';

        return euroFormatter.format(val);
    } catch (e) {
        console.error("Erreur safeCurrencyFormatter:", e);
        return '';
    }
};