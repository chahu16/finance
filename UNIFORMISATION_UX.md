# Uniformisation UX — Finance V02

Référence : DataGrid dépenses-recettes (`DataGrid.jsx` + `GridStyles.js`)

---

## 1. Ce que fait la référence (DataGrid)

### Clavier

| Situation | Enter | Échap | Tab |
|---|---|---|---|
| Édition champ texte / nombre | Sauvegarde la ligne | 1er : vide le champ · 2e : annule + snackbar warning | Champ suivant (cycle) |
| Édition champ date (`GridEditDateCell`) | Sauvegarde la ligne | 1er : vide la date · 2e : annule | Champ suivant |
| Vue (hors édition) | Démarre l'édition sur la cellule | — | — |
| Dialog suppression | Confirme | Ferme | — |

### Snackbar

| Cas | Sévérité | Message |
|---|---|---|
| Sauvegarde OK | `success` | `messages.success` (configurable) |
| Annulation | `warning` | `messages.cancel` (configurable) |
| Erreur validation / API sauvegarde | `error` | Tous les messages d'erreur, joints par ` · ` (dédupliqués) |
| Erreur API suppression | `error` | `err.message` ou fallback |

Position : `bottom · center` — durée : 3 s — clickaway ignoré — `variant="filled"`.

### Dialog de suppression

- `transitionDuration={0}` + `sx={deleteDialogSx}` (backdrop 20 %, outline:none)
- Enter → confirme · Échap → ferme
- Boutons : **Annuler** (inherit) + **Supprimer** (error + contained)
- Erreur API → snackbar `error` avec `err.message`

### Champs date

`GridEditDateCell` (couplé à `useGridApiContext`) :
- `maxDate = today` (bloquer dates futures)
- Locale `fr`, actions `['today', 'clear', 'cancel']`
- `variant="standard"`, `disableUnderline` (intégration dans la cellule)
- Fond bleu léger en édition, fond rouge + outline rouge si `cell-error`

### Validation

- Moteur générique : `getRowErrors()` dans `utils/GridValidation.js`
- Affichage erreur : classe CSS `cell-error` sur la cellule (fond rouge + outline)
- Snackbar `error` avec le premier message
- Règles communes : date obligatoire, pas dans le futur, montant > 0

---

## 2. Référence DataGrid — corrections appliquées (2026-06-24)

| Point | Fix |
|---|---|
| Échap après validation vide | `onProcessRowUpdateError` → `setCellFocus` après 100 ms (MUI perd le focus lors du revert View→Edit) |
| Croix (×) sans snackbar | `key` incrémental sur `<Snackbar>` → force remontage + reset timer `autoHideDuration` |
| Fond rouge cellule focusée | Règle CSS `.cell-error.MuiDataGrid-cell--editing:focus-within` ajoutée (`GridStyles.js`) — spécificité = celle du sélecteur `:focus-within` bleu |
| Snackbar pas tous champs | `errors.recettes = true` → message string dans `DepensesRecettesValidation.js` ; `buildErrorMessage` déduplique les messages identiques |

---

## 3. État par module — après implémentation

### InvestissementsTab — valorisations (add + edit)

| Point | État |
|---|---|
| Enter | ✅ Sauvegarde |
| Échap date | ✅ `AppDatePicker` : 1er Échap vide, 2e → `onCancel` (annule + snackbar warning) |
| Échap valeur (edit) | ✅ 1er Échap restaure valeur originale, 2e annule session |
| Échap valeur (add) | ✅ 1er Échap vide le champ, 2e annule session (via onKeyDown inline) |
| Tab sur Cancel | ⚠️ Sort encore du cycle — reste à corriger (Tab Cancel → retour 1er champ) |
| Snackbar | ✅ `useAppSnackbar` + `AppSnackbar` — bottom·center, 3 s, filled, timer reset via `key` |
| Snackbar tous champs | ✅ `Object.values(errors).join(' · ')` — tous les messages d'erreur affichés |
| Croix (×) ADD | ✅ `showSnackbar('Édition annulée', 'warning')` ajouté dans le `onClick` du bouton × ADD |
| Validation date future | ✅ `validateDate()` partagé |
| Dialog suppression | ✅ `AppDeleteDialog` — Enter confirme, Échap ferme |
| Affichage erreur date | ✅ `AppDatePicker` : `error` + `helperText` + fond rouge via `sx` sur `MuiPickersInputBase-root` |
| Affichage erreur valeur | ✅ `TextField` : `error` + `helperText` + fond rouge via `sx` conditionnel sur `MuiInputBase-root` |
| Focus au clic + | ✅ `requestAnimationFrame` ×2 si accordion ouvert, `TransitionProps.onEntered` si fermé |
| Taille égale date/valeur | ✅ CSS Grid `1fr 1fr auto` + `fullWidth` sur TextField valeur |
| Hauteur égale date/valeur | ✅ Fix `AppDatePicker` : merge `slotProps` + `sx` sur `.MuiPickersSectionList-root` pour `fontSize` |

### InvestissementsTab — retraits (montant brut)

| Point | État |
|---|---|
| Enter | ✅ Sauvegarde |
| Échap | ✅ Annule + snackbar warning |
| Tab | ✅ Tab → sauvegarde |
| Snackbar | ✅ `useAppSnackbar` + `AppSnackbar` |
| Validation montant | ✅ `validateMontantPositifOuNul()` partagé |

### PlafondNotesFrais

| Point | État |
|---|---|
| Enter | ✅ Sauvegarde (sur TextField montant + AppDatePicker) |
| Échap | ✅ Vide le champ date (`AppDatePicker`) / vide montant (TextField) |
| Snackbar | ✅ `useAppSnackbar` + `AppSnackbar` — succès + erreur API |
| Champ date | ✅ `AppDatePicker` — locale fr, maxDate today, actions today/clear/cancel |
| Validation date future | ✅ `validateDate()` partagé |
| Validation montant | ✅ `validateMontantPositif()` partagé |
| Tab cyclique | — Non applicable (formulaire simple, Tab natif suffit) |

---

## 4. Briques partagées à créer

Dossier cible : `frontend/src/components/utils/`

---

### `validators.js`

Règles de validation partagées entre les `*Validation.js` du DataGrid et les formulaires libres.

```js
// Retourne null si valide, sinon un message d'erreur string

export function validateDate(value) {
    if (!value) return 'La date est obligatoire';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return 'Date invalide';
    const today = new Date(); today.setHours(23, 59, 59, 999);
    if (d > today) return 'La date ne peut pas être dans le futur';
    return null;
}

export function validateMontantPositif(value) {
    const v = parseFloat(value);
    if (value === '' || value == null) return 'Le montant est obligatoire';
    if (isNaN(v) || v <= 0) return 'Le montant doit être supérieur à 0';
    return null;
}

export function validateMontantPositifOuNul(value) {
    const v = parseFloat(value);
    if (value === '' || value == null) return 'La valeur est obligatoire';
    if (isNaN(v) || v < 0) return 'La valeur doit être positive ou nulle';
    return null;
}
```

Fichiers impactés : `DepensesRecettesValidation.js`, `VirementInternesValidation.js`, `InvestissementsTab.jsx` (`validateHistorique`), `PlafondNotesFrais.jsx`.

---

### `useAppSnackbar.js`

Hook qui centralise les 3 états + callbacks dupliqués dans chaque composant.

```js
import { useState, useCallback } from 'react';

export function useAppSnackbar() {
    // key incrémental → force le remontage de <Snackbar> → reset du timer autoHideDuration
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success', key: 0 });

    const show = useCallback((message, severity = 'success') => {
        setSnackbar(prev => ({ open: true, message, severity, key: prev.key + 1 }));
    }, []);

    const handleClose = useCallback((_, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    return { snackbar, show, handleClose };
}
```

---

### `AppSnackbar.jsx`

Composant Snackbar + Alert préconfiguré, identique au DataGrid.

```jsx
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export function AppSnackbar({ snackbar, onClose }) {
    return (
        <Snackbar
            key={snackbar.key}          {/* remontage forcé → reset timer */}
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert onClose={onClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                {snackbar.message}
            </Alert>
        </Snackbar>
    );
}
```

Usage : `const { snackbar, show, handleClose } = useAppSnackbar();` + `<AppSnackbar snackbar={snackbar} onClose={handleClose} />`

---

### `AppDeleteDialog.jsx`

Dialog de suppression préconfigurée, identique au comportement DataGrid.

```jsx
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { deleteDialogSx } from '../../styles/GridStyles.js';

export function AppDeleteDialog({ open, onConfirm, onCancel, title, children }) {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            transitionDuration={0}
            sx={deleteDialogSx}
            onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onConfirm(); }
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel(); }
            }}
        >
            <DialogTitle>{title ?? 'Confirmer la suppression'}</DialogTitle>
            <DialogContent>
                <DialogContentText>{children}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit">Annuler</Button>
                <Button onClick={onConfirm} color="error" variant="contained">Supprimer</Button>
            </DialogActions>
        </Dialog>
    );
}
```

---

### `AppDatePicker.jsx`

DatePicker MUI X préconfigurée pour les formulaires libres (hors DataGrid).

Règles identiques au DataGrid :
- `maxDate = today` (bloque les dates futures)
- Locale `fr`
- Actions `['today', 'clear', 'cancel']`
- `error` + `helperText` câblés
- **Fond rouge léger quand `error=true`** (identique à `cell-error` DataGrid) — cibler `MuiPickersInputBase-root` + `MuiPickersOutlinedInput-root` (classes spécifiques MUI X, pas `MuiInputBase-root`)
- Enter → callback `onSave`, Tab → callback `onTabNext` / `onTabPrev`
- Échap : 1er Échap vide la date (géré via capture `document.addEventListener`) ; 2e → `onCancel`
- `slotProps` externes fusionnés proprement — `sx` mergé après le spread pour ne pas être écrasé

```jsx
// Voir src/components/utils/AppDatePicker.jsx pour l'implémentation complète.
// Points clés dans slotProps.textField :
sx: {
    ...(error ? {
        '& .MuiInputBase-root, & .MuiPickersInputBase-root, & .MuiPickersOutlinedInput-root': {
            backgroundColor: 'rgba(211, 47, 47, 0.08)',
        },
    } : {}),
    ...(externalSlotProps?.textField?.sx || {}),  // sx externe mergé après
},
```

**Affichage erreur dans les formulaires libres (hors DataGrid) :**
- `AppDatePicker` : `error` + `helperText` + fond rouge via `sx` (voir ci-dessus)
- `TextField` standard : `error` + `helperText` + fond rouge via `sx` conditionnel inline :
  ```jsx
  sx={{ ...(erreurs.champ && { '& .MuiInputBase-root': { backgroundColor: 'rgba(211, 47, 47, 0.08)' } }) }}
  ```

---

## 5. Ordre d'implémentation — DONE ✅

1. **`validators.js`** ✅ — branché dans `DepensesRecettesValidation`, `VirementInternesValidation`, `FraisFixesValidation`, `InvestissementsValidation`, `InvestissementsHistoriqueValidation`, `InvestissementsTab` (validateHistorique), `PlafondNotesFrais`.
2. **`useAppSnackbar.js` + `AppSnackbar.jsx`** ✅ — utilisés dans `InvestissementCard`, `InvestissementsTab`, `PlafondNotesFrais`.
3. **`AppDeleteDialog.jsx`** ✅ — remplace le Dialog inline dans `InvestissementCard`.
4. **`AppDatePicker.jsx`** ✅ — remplace les DatePickers manuels dans valorisations (add + edit) ET le `TextField type="date"` natif de `PlafondNotesFrais`. Gère Échap en interne (clear → onCancel), Enter → onSave, Tab → onTabNext/Prev.
5. **Clavier Tab cyclique** dans `InvestissementCard` — local, non mutualisable. Reste à corriger (Tab Cancel → retour 1er champ).

---

## 6. Ce qui reste local (pas mutualisable)

- **Tab cyclique** (Cancel → retour 1er champ) dans `InvestissementCard` : logique de refs trop liée à la structure interne.
- **`GridEditDateCell`** : couplé à `useGridApiContext`, ne peut pas être extrait hors DataGrid. `AppDatePicker` est l'équivalent pour les formulaires libres.
- **`cell-error`** (fond rouge sur cellule DataGrid) : classe CSS spécifique au DataGrid MUI. Équivalent dans les formulaires libres : `error + helperText + sx fond rouge` sur chaque champ (voir `AppDatePicker` et pattern `TextField` ci-dessus).
