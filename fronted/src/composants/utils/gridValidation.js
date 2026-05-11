/**
 * ============================================================
 * MOTEUR DE VALIDATION DES LIGNES (DATAGRID)
 * ============================================================
 * Cette fonction analyse une ligne et ses colonnes pour détecter
 * toute incohérence avant la sauvegarde.
 * * @param {Object} row - Les données de la ligne à valider.
 * @param {Array} columns - La configuration des colonnes du DataGrid.
 * @param {Function} validateRow - La fonction de validation métier globale (optionnelle).
 * @returns {Object} Un objet contenant les champs en erreur (ex: { depenses: true }).
 */
export const getRowErrors = (row, columns, validateRow) => {
    const errors = {};

    // Sécurité de base : si la ligne n'est pas un objet valide, on arrête.
    if (!row || typeof row !== 'object') return errors;

    const safeColumns = Array.isArray(columns) ? columns : [];

    // --- ANALYSE COLONNE PAR COLONNE ---
    safeColumns.forEach((col) => {
        // On ignore les colonnes techniques ou les actions
        if (!col.field || col.field === 'actions') return;

        const value = row[col.field];

        // Détection de la vacuité (gère null, undefined, espaces)
        const isEmpty =
            value === null ||
            value === undefined ||
            String(value).trim() === "";

        // 1. VALIDATION DE PRÉSENCE (Propriété 'required' dans la config)
        if (col.required && isEmpty) {
            errors[col.field] = true;
        }

        // 2. VALIDATION PERSONNALISÉE PAR COLONNE (Via 'col.validate')
        else if (typeof col.validate === 'function') {
            try {
                // Injection d'une chaîne vide par défaut pour éviter les crashs de .trim() ou .length
                const validationResult = col.validate(value ?? "");
                if (validationResult !== true) {
                    errors[col.field] = true;
                }
            } catch (e) {
                console.error(`Erreur dans la validation de la colonne "${col.field}":`, e);
            }
        }

        // 3. VALIDATION DE VALEUR MINIMALE (Numérique)
        else if (
            col.minValue !== undefined &&
            !isEmpty &&
            !isNaN(value) &&
            Number(value) < col.minValue
        ) {
            errors[col.field] = true;
        }
    });

    // --- 4. VALIDATION MÉTIER GLOBALE (LOGIQUE CROISÉE) ---
    // Cette partie appelle la fonction de validation spécifique à ton métier 
    // (ex: vérifier que dépenses et recettes ne sont pas remplies en même temps).
    if (typeof validateRow === 'function') {
        try {
            const globalErrors = validateRow(row);
            if (globalErrors && typeof globalErrors === 'object') {
                // On fusionne les erreurs globales avec les erreurs de colonnes
                Object.assign(errors, globalErrors);
            }
        } catch (e) {
            console.error("Erreur dans la fonction validateRow globale:", e);
        }
    }

    return errors;
};