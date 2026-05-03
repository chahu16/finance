/**
 * ============================================================
 * STYLES GÉNÉRAUX DU DATAGRID (MUI)
 * ============================================================
 */
export const gridStyle = {
  height: "100%",
  width: "100%",
  "& .MuiDataGrid-columnHeaderTitleContainer": {
    justifyContent: "center",
  },
  "& .actions": { color: "text.secondary" },

  // --- ÉTAT : Cellule en cours de saisie ---
  "& .MuiDataGrid-cell--editing:focus-within": {
    backgroundColor: "rgba(2, 136, 209, 0.05) !important",
    // Utilisation de box-shadow interne pour éviter de modifier la taille de la cellule
    boxShadow: "inset 0 0 0 1px #0288d1 !important",
  },

  "& .MuiDataGrid-cell--editing .MuiInputBase-root": {
    backgroundColor: "transparent !important",
    height: "100%",
  },

  // --- ÉTAT : Gestion des Erreurs ---
  "& .cell-error": {
    backgroundColor: "rgba(211, 47, 47, 0.08) !important",
    // On force la couleur rouge sur le texte et les icônes (Adornments)
    "& input, & .MuiSelect-select, & .MuiSvgIcon-root": {
      color: "#d32f2f !important",
    },
    // Bordure rouge interne discrète sans décalage de pixels
    boxShadow: "inset 0 0 0 1px rgba(211, 47, 47, 0.3) !important",
  },

  // Style pour la ligne entière en erreur (utilisé dans getRowClassName)
  "& .force-error-style": {
    borderLeft: "4px solid #d32f2f !important", // Indicateur visuel fort à gauche
  },

  // Nettoyage des bordures par défaut de MUI en mode édition
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none !important",
  },
  "& .row-archived": {
    backgroundColor: "rgba(0, 0, 0, 0.20)",
    color: "rgba(0, 0, 0, 0.38)",
  },
  "& .row-archived:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.08) !important",
  },
};

/**
 * ============================================================
 * STYLES DES BOUTONS D'ACTION
 * ============================================================
 */
export const addButtonStyle = {
  textTransform: "none",
  fontWeight: 600,
  color: "#000000",
  borderColor: "#000000",
  backgroundColor: "#ffffff",
  transition: "all 0.2s ease-in-out",

  "&:hover": {
    backgroundColor: "#f5f5f5",
    borderColor: "#000000",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
    transform: "translateY(-1px)", // Petit effet de levier au survol
  },

  "&:active": {
    transform: "translateY(0px)",
  },

  // Sécurité pour l'accessibilité clavier
  "&:focus-visible": {
    outline: "2px solid #0288d1",
    outlineOffset: "2px",
  },

  borderRadius: "4px",
  px: 2,
};

/**
 * ============================================================
 * STYLES DU DIALOGUE DE SUPPRESSION
 * ============================================================
 */
export const dialogActionsStyle = {
  pb: 2,
  px: 3
};

/**
 * ============================================================
 * STYLES DE LA SNACKBAR
 * ============================================================
 */
export const snackbarAlertStyle = {
  width: "100%",
  whiteSpace: "pre-line",
  minWidth: "300px",
  borderRadius: "8px",
  fontWeight: 500,
  fontSize: "0.95rem",
  "& .MuiAlert-icon": {
    fontSize: "22px",
  },
};