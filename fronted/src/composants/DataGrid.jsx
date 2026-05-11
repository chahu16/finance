/* Imports */
import {
  useState, useEffect, useMemo, useCallback, useRef,
} from "react";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import { getRowErrors } from "./utils/gridValidation";
import {
  gridStyle, addButtonStyle, dialogActionsStyle, snackbarAlertStyle
} from "./styles/GridStyles.js";
import { frFR } from "@mui/x-data-grid/locales";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"; // ou AdapterDayjs selon ta préférence
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import fr from "date-fns/locale/fr"; // Pour avoir le calendrier en français
import ImportCSV from "./CSV/ImportCSV";
import {
  GridRowModes, DataGrid, GridToolbarContainer, useGridApiContext, GridActionsCellItem, useGridApiRef,
} from "@mui/x-data-grid";
import { randomId } from "@mui/x-data-grid-generator";

/* Barre d'outils au-dessus de la grille qui contient le bouton "Ajouter" :
      - 1 génère un nouvel ID unique via randomId()
      - 2 Elle injecte une ligne "vide" (isNew: true) dans l'état rows
      - 3 Elle force immédiatement cette nouvelle ligne en mode édition (GridRowModes.Edit) en ciblant le champ "name".
*/

function EditToolbar({
  setRows,
  setRowModesModel,
  fieldFocusAdd,
  emptyRow,
  setShowErrors,
  addButtonLabel,
  isAnyRowEditing,
  columns,
  onDataParsed,
  onToggleArchived,
  showArchived,
  archivedLabel,
}) {
  const handleClick = () => {
    if (isAnyRowEditing) return;
    setShowErrors(false);
    const id = randomId();
    setRows((oldRows) => [{ ...emptyRow, id, isNew: true }, ...oldRows]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: fieldFocusAdd },
    }));
  };

  return (
    <GridToolbarContainer sx={{ p: 1, display: "flex", gap: 1, justifyContent: "flex-end" }}>
      <Button
        color="primary"
        variant="outlined"
        startIcon={<AddIcon />}
        disabled={isAnyRowEditing}
        onClick={handleClick}
        size="small"
        sx={addButtonStyle}
      >
        {addButtonLabel || "Ajouter"}
      </Button>

      <ImportCSV
        columns={columns}
        onDataParsed={onDataParsed}
        disabled={isAnyRowEditing}
      />
      {onToggleArchived && (
        <Button
          color="inherit"
          variant="outlined"
          onClick={onToggleArchived}
          size="small"
          sx={addButtonStyle}
        >
          {archivedLabel ? archivedLabel(showArchived) : (showArchived ? "Cacher archivés" : "Afficher archivés")}
        </Button>
      )}
    </GridToolbarContainer >
  );
}

/* Composant qui décide quelles icônes afficher dans la colonne "Actions" :
      - useGridSelector pour observer l'état global de la grille et savoir si la ligne actuelle est en mode "édition" ou "lecture".
*/

function GridEditDateCell(props) {
  const { id, value, field, shouldAutoFocus, noMaxDate, hideCalendarHeader } = props;
  const apiRef = useGridApiContext();

  const maxLimit = new Date();
  maxLimit.setHours(23, 59, 59, 999);

  const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());
  const dateValue =
    value && isValidDate(new Date(value)) ? new Date(value) : null;

  const handleChange = (newValue) => {
    if (newValue === null || isValidDate(newValue)) {
      apiRef.current.setEditCellValue({ id, field, value: newValue });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <DatePicker
        value={dateValue}
        onChange={handleChange}
        {...(!noMaxDate && { maxDate: maxLimit })}
        {...(hideCalendarHeader && { views: ['day'] })}
        localeText={{
          todayButtonLabel: "Aujourd'hui",
          clearButtonLabel: "Effacer",
          cancelButtonLabel: "Annuler",
        }}
        slotProps={{
          actionBar: {
            // On garde uniquement Aujourd'hui, Effacer et Annuler
            actions: ["today", "clear", "cancel"],
          },
          calendarHeader: hideCalendarHeader ? {
            sx: { display: "none" },
          } : undefined,
          textField: {
            variant: "standard",
            fullWidth: true,
            autoFocus: shouldAutoFocus,
            InputProps: {
              disableUnderline: true,
            },
            sx: {
              "& .MuiInputBase-input": {
                textAlign: "center",
                padding: "0px",
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}

/* Fonction principale */
export default function FullFeaturedCrudGrid({
  columns: customColumns,
  initialRows,
  onRowsUpdate,
  validateRow,
  addButtonLabel,
  applyRules,
  getRowTypeLabel,
  onSaveRow,
  onSaveRowsBulk,
  onDeleteRow,
  onDeleteCheck,
  height,
  onArchiveRow,
  hideCopyButton,
  onToggleArchived,
  showArchived,
  archivedLabel,
  externalRows,
}) {
  const apiRef = useGridApiRef();
  const [rows, setRows] = useState(initialRows);
  const [rowModesModel, setRowModesModel] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState(null);
  const [isArchiveAction, setIsArchiveAction] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [columnDimensions, setColumnDimensions] = useState({});

  const rowErrorsCache = useRef({});
  const rowModesModelRef = useRef(rowModesModel);
  const prevInitialRowsRef = useRef(initialRows);

  useEffect(() => {
    if (externalRows !== undefined) {
      setRows(externalRows);
    }
  }, [externalRows]);

  useEffect(() => {
    if (initialRows && initialRows !== prevInitialRowsRef.current) {
      prevInitialRowsRef.current = initialRows;
      setRows(initialRows);
    }
  }, [initialRows]);

  useEffect(() => {
    rowModesModelRef.current = rowModesModel;
  }, [rowModesModel]);


  useEffect(() => {
    if (onRowsUpdate) {
      onRowsUpdate(rows);
    }
  }, [rows, onRowsUpdate]);

  const selectTextInCell = useCallback(
    (id, field) => {
      // On attend un tout petit peu que MUI passe la cellule en mode <input>
      setTimeout(() => {
        const cell = apiRef.current.getCellElement(id, field);
        const input = cell?.querySelector("input");
        if (input) {
          input.select(); // Surligne le texte en bleu
        }
      }, 50);
    },
    [apiRef],
  );

  const triggerSnackbar = useCallback((message, severity = "success") => {
    // On ferme d'abord l'actuelle pour reset le timer
    setSnackbar((prev) => ({ ...prev, open: false }));

    // On attend un micro-délai (tick) pour que React traite le changement d'état
    setTimeout(() => {
      setSnackbar({
        open: true,
        message,
        severity,
      });
    }, 10);
  }, []);

  const handleColumnWidthChange = useCallback((params) => {
    setColumnDimensions((prev) => ({
      ...prev,
      [params.colDef.field]: params.width,
    }));
  }, []);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  /* Gestion ajout ligne "vide" */
  const emptyRow = useMemo(() => {
    const obj = {};
    customColumns.forEach((col) => {
      if (col.type === "number") obj[col.field] = 0;
      else if (col.type === "boolean") obj[col.field] = false;
      else obj[col.field] = "";
    });
    return obj;
  }, [customColumns]);

  /* Gestion du focus sur la "bonne" colonne lors d'un ajout de ligne */
  const fieldFocusAdd = useMemo(
    () =>
      customColumns.find((col) => col.isInitialFocus)?.field ||
      customColumns[0].field,
    [customColumns],
  );

  /* Détecte quelle colonne doit prendre le focus lors d'une édition (clic sur crayon) */
  const fieldFocusEdit = useMemo(
    () => customColumns.find((col) => col.isEditFocus)?.field || fieldFocusAdd,
    [customColumns, fieldFocusAdd],
  );

  /* Gestion du focus sur la "bonne" colonne lors d'une copie de ligne de ligne */
  const fieldFocusCopy = useMemo(
    () => customColumns.find((col) => col.isCopyFocus)?.field || fieldFocusAdd,
    [customColumns, fieldFocusAdd],
  );

  // On vérifie si une ligne (n'importe laquelle) est en mode 'edit'
  const isAnyRowEditing = Object.values(rowModesModel).some(
    (row) => row.mode === GridRowModes.Edit,
  );

  // Fonction pour extraire les erreurs d'une ligne (qu'elle soit en édition ou non)
  const getLiveRowErrors = useCallback(
    (id) => {
      if (!apiRef.current?.state) return {};

      const editRowsState = apiRef.current.state.editRows;
      const editingRowState = editRowsState[id];

      const row = apiRef.current.getRow(id);
      if (!row) return {};

      const liveRow = { ...row };
      if (editingRowState) {
        Object.keys(editingRowState).forEach((field) => {
          liveRow[field] = editingRowState[field].value;
        });
      }

      // On recalcule seulement si la ligne est en cours d'édition
      if (editingRowState) {
        rowErrorsCache.current[id] = getRowErrors(liveRow, customColumns, validateRow);
      }

      return rowErrorsCache.current[id] || {};
    },
    [apiRef, customColumns, validateRow],
  );

  /* Gestion de la bascule d(une ligne spécifique en mode "Édition" */
  const handleEditClick = useCallback(
    (id, fieldToFocus) => {
      // LOGIQUE :
      // 1. Si fieldToFocus existe (double-clic), on l'utilise.
      // 2. Sinon, on utilise fieldFocusEdit (bouton crayon).
      const targetField = fieldToFocus || fieldFocusEdit;

      setShowErrors(false);
      setRowModesModel((prev) => ({
        ...prev,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: targetField },
      }));

      setTimeout(() => {
        selectTextInCell(id, targetField);
      }, 100);
    },
    [fieldFocusEdit, selectTextInCell],
  );
  /* Gestion de la fin d'édition et de la sauvegarde */
  const handleSaveClick = useCallback((id) => {
    setRowModesModel((prevRowModesModel) => ({
      ...prevRowModesModel,
      [id]: { mode: GridRowModes.View },
    }));
  }, []);

  /* Gestion de la suppression de ligne */
  const handleDeleteClick = useCallback(
    async (id) => {
      const row = rows.find((r) => r.id === id);
      setRowToDelete(row);

      // Si onDeleteCheck est fourni, on l'appelle pour obtenir un message personnalisé
      if (onDeleteCheck) {
        try {
          const result = await onDeleteCheck(row);
          if (result?.isArchive !== undefined) {
            setDeleteConfirmMessage(result.message);
            setIsArchiveAction(result.isArchive);
          } else {
            setDeleteConfirmMessage(result);
            setIsArchiveAction(false);
          }
        } catch (err) {
          setDeleteConfirmMessage(null);
        }
      } else {
        setDeleteConfirmMessage(null);
      }

      setOpenDeleteDialog(true);
    },
    [rows, onDeleteCheck],
  );

  /* Gestion du bouton annuler */
  const handleCancelClick = useCallback(
    (id) => {
      // 1. Sortie du mode édition
      setRowModesModel((prevRowModesModel) => ({
        ...prevRowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      }));

      setShowErrors(false);

      // 2. Gestion des lignes et notification
      setRows((prevRows) => {
        const editedRow = prevRows.find((row) => row.id === id);
        if (!editedRow) return prevRows;

        // Délai de 100ms pour éviter le conflit de rendu avec la grille
        setTimeout(() => {
          triggerSnackbar(
            editedRow.isNew ? "Ajout annulé" : "Modifications annulées",
            "warning",
          );
        }, 100);

        if (editedRow.isNew) {
          return prevRows.filter((row) => row.id !== id);
        }
        return prevRows;
      });
    },
    [triggerSnackbar],
  );

  /* Gestion de la ligne copiée */
  const handleCopyClick = useCallback(
    (id) => {
      const newId = randomId();

      setRows((prevRows) => {
        const rowIndex = prevRows.findIndex((row) => row.id === id);
        if (rowIndex === -1) return prevRows;

        const copiedRow = { ...prevRows[rowIndex], id: newId, isNew: true };
        const newRows = [...prevRows];
        newRows.splice(rowIndex, 0, copiedRow);
        return newRows;
      });

      setRowModesModel((prev) => ({
        ...prev,
        [newId]: { mode: GridRowModes.Edit, fieldToFocus: fieldFocusCopy },
      }));
    },
    [fieldFocusCopy],
  );

  /* Manipulation des données et gère l'interface */
  const actionHandlers = useMemo(
    () => ({
      handleEditClick: (id, fieldToFocus) => handleEditClick(id, fieldToFocus),
      handleSaveClick,
      handleDeleteClick,
      handleCancelClick,
      handleCopyClick,
      isAnyRowEditing,
    }),
    [
      handleEditClick,
      handleSaveClick,
      handleDeleteClick,
      handleCancelClick,
      handleCopyClick,
      isAnyRowEditing,
    ],
  );

  const columns = useMemo(
    () => [
      ...customColumns.map((col) => {
        const currentWidth = columnDimensions[col.field] || col.width;
        return {
          ...col,
          width: currentWidth,
          valueFormatter: col.valueFormatter
            ? (params) => {
              try { return col.valueFormatter(params); }
              catch (e) { return params.value; }
            }
            : undefined,
          renderEditCell: col.type === "date"
            ? (params) => (
              <GridEditDateCell
                {...params}
                shouldAutoFocus={rowModesModelRef.current[params.id]?.fieldToFocus === col.field}
                noMaxDate={!!col.noMaxDate}
                hideCalendarHeader={!!col.hideCalendarHeader}
              />
            )
            : undefined,
          cellClassName: (params) => {
            if (!showErrors) return col.cellClassName || "";
            const errors = getLiveRowErrors(params.id);
            return errors[col.field] ? "cell-error" : col.cellClassName || "";
          },
          preProcessEditCellProps: col.type === 'singleSelect'
            ? undefined
            : (params) => ({ ...params.props, error: false }),
        };
      }),
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 100,
        cellClassName: "actions",
        getActions: (params) => {
          const isInEditMode = typeof rowModesModelRef.current[params.id] !== "undefined";
          if (isInEditMode) {
            return [
              <GridActionsCellItem icon={<SaveIcon />} label="Save" sx={{ color: "primary.main" }} onClick={() => actionHandlers.handleSaveClick(params.id)} />,
              <GridActionsCellItem icon={<CancelIcon />} label="Cancel" onClick={() => actionHandlers.handleCancelClick(params.id)} color="inherit" />,
            ];
          }
          const actions = [];
          if (!hideCopyButton) {
            actions.push(
              <GridActionsCellItem icon={<ContentCopyIcon />} label="Copy" onClick={() => actionHandlers.handleCopyClick(params.id)} disabled={actionHandlers.isAnyRowEditing} color="inherit" />
            );
          }
          if (!params.row.archive) {
            actions.push(
              <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => actionHandlers.handleEditClick(params.id)} disabled={actionHandlers.isAnyRowEditing} color="inherit" />
            );
          }
          if (onArchiveRow) {
            actions.push(
              <GridActionsCellItem
                icon={params.row.archive ? <UnarchiveIcon /> : <ArchiveIcon />}
                label={params.row.archive ? "Désarchiver" : "Archiver"}
                onClick={() => onArchiveRow(params.row)}
                disabled={actionHandlers.isAnyRowEditing}
                color="inherit"
              />
            );
          }
          actions.push(
            <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => actionHandlers.handleDeleteClick(params.id)} disabled={actionHandlers.isAnyRowEditing} color="inherit" />
          );
          return actions;
        },
      },
    ],
    [customColumns, showErrors, columnDimensions, getLiveRowErrors, actionHandlers, onArchiveRow, hideCopyButton],
  );

  const nameColumn = columns.find((col) => col.isNameField);
  const nameValue = rowToDelete ? rowToDelete[nameColumn?.field] : "";

  /* Valide les données avant sauvegarde */
  const processRowUpdate = useCallback(
    async (newRow, oldRow) => {
      const rowWithRules = applyRules ? applyRules(newRow, oldRow) : newRow;

      // --- POINT 1 : Validation centralisée ---
      const errors = getRowErrors(rowWithRules, customColumns, validateRow);
      const hasError = Object.keys(errors).length > 0;

      if (hasError) {
        setShowErrors(true);
        const error = new Error("Validation échouée");
        error.rowId = newRow.id;
        throw error;
      }

      setShowErrors(false);
      const wasNew = !!rowWithRules.isNew;
      const updatedRow = { ...rowWithRules, isNew: false };

      if (onSaveRow) {
        try {
          // On récupère la ligne formatée (ID MongoDB + Nom du compte)
          const savedRowFromServer = await onSaveRow(updatedRow, oldRow);

          // On met à jour l'état local du DataGrid
          setRows((prev) =>
            prev.map((r) => (r.id === updatedRow.id ? savedRowFromServer : r)),
          );

          triggerSnackbar("Enregistrement réussi", "success");

          // TRÈS IMPORTANT : On retourne savedRowFromServer à MUI
          // C'est ce return qui dit à la grille : "L'ID temp-xxx est devenu ID_MONGO"
          return savedRowFromServer;
        } catch (error) {
          const serverMessage = error.response?.data?.message || error.message || "Erreur de sauvegarde";
          triggerSnackbar(serverMessage, "error");
          // Si c'est une nouvelle ligne, on la retire du grid (la création a échoué)
          if (wasNew) {
            setRows((prev) => prev.filter((r) => r.id !== updatedRow.id));
          }
          return oldRow;
        }
      }

      setRows((prev) => {
        const next = prev.map((r) =>
          r.id === rowWithRules.id ? updatedRow : r,
        );
        return next;
      });

      triggerSnackbar("Modifications enregistrées avec succès !", "success");
      return updatedRow;
    },
    [onSaveRow, customColumns, validateRow, applyRules, triggerSnackbar],
  );

  const handleConfirmDelete = async () => {
    if (rowToDelete) {
      try {
        // 1. On tente la suppression réelle sur le serveur
        if (onDeleteRow) {
          await onDeleteRow(rowToDelete);
        }

        // 2. Si ça réussit, on met à jour l'interface locale
        setRows((prevRows) =>
          prevRows.filter((row) => row.id !== rowToDelete.id),
        );

        triggerSnackbar("Élément supprimé avec succès", "success");
      } catch (error) {
        // 3. En cas d'erreur, on avertit l'utilisateur sans supprimer la ligne
        triggerSnackbar(
          "Erreur serveur : impossible de supprimer l'élément",
          "error",
        );
      } finally {
        // Dans tous les cas, on ferme la boîte de dialogue
        setOpenDeleteDialog(false);
        setRowToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setDeleteConfirmMessage(null);
    triggerSnackbar("Suppression annulée", "warning");
  };

  const handleCellKeyDown = useCallback(
    (params, event) => {
      // --- GESTION DES CHECKBOX (Touche Entrée) ---
      // On vérifie si c'est un booléen ou si le nom du champ contient 'notes' ou 'Masquer'
      const isCheckbox = params.colDef.type === "boolean";

      if (event.key === "Enter" && isCheckbox) {
        event.preventDefault();
        event.stopPropagation();
        event.defaultMuiPrevented = true;

        // On récupère la valeur la plus fraîche via l'apiRef
        const row = apiRef.current.getRowWithUpdatedValues(
          params.id,
          params.field,
        );
        const currentValue = row[params.field];
        const newValue = !currentValue;

        apiRef.current.setEditCellValue({
          id: params.id,
          field: params.field,
          value: newValue,
        });

        return;
      }

      if (
        event.key === "Tab" &&
        rowModesModel[params.id]?.mode === GridRowModes.Edit
      ) {
        const columnFields = columns
          .map((c) => c.field)
          .filter((f) => f !== "actions");
        const firstField = columnFields[0];
        const lastField = "actions";

        // --- LOGIQUE DE NAVIGATION CLASSIQUE (Champ à champ) ---
        if (params.field !== lastField && !event.shiftKey) {
          const currentIndex = columnFields.indexOf(params.field);
          const nextField = columnFields[currentIndex + 1] || lastField;

          event.preventDefault();
          event.stopPropagation();

          apiRef.current.setCellFocus(params.id, nextField);

          setTimeout(() => {
            const nextCell = apiRef.current.getCellElement(
              params.id,
              nextField,
            );
            const input = nextCell?.querySelector("input");

            if (input) {
              input.focus();

              // --- SPÉCIAL DATE (Fix pour laisser le bleu) ---
              if (nextField.toLowerCase().includes("date")) {
                // On lance une rafale sur 3 frames pour maintenir la sélection
                // malgré le script interne de MUI DatePicker
                const forceSelection = () => {
                  if (document.activeElement === input) {
                    input.select();
                    // Pour les champs date segmentés, on force le début
                    input.setSelectionRange(0, 2);
                  }
                };

                requestAnimationFrame(forceSelection);
                setTimeout(forceSelection, 10);
                setTimeout(forceSelection, 50);
              } else {
                // Pour les autres champs, sélection standard
                input.select();
              }
            }
          }, 20);

          return;
        }

        // --- LOGIQUE DE LA COLONNE ACTIONS (Déjà validée ensemble) ---
        if (params.field === lastField && !event.shiftKey) {
          const actionCell = apiRef.current.getCellElement(
            params.id,
            "actions",
          );
          const buttons = actionCell
            ? Array.from(actionCell.querySelectorAll("button"))
            : [];
          const saveButton = buttons[0];
          const cancelButton = buttons[1];

          // Disquette -> Croix
          if (event.target === saveButton && cancelButton) {
            event.preventDefault();
            event.stopPropagation();
            cancelButton.focus();
            return;
          }

          // Croix -> Retour au début (Boucle)
          if (event.target === cancelButton || buttons.length <= 1) {
            event.preventDefault();
            event.stopPropagation();
            apiRef.current.setCellFocus(params.id, firstField);
          }
        }
      }
    },
    [columns, rowModesModel, apiRef],
  );

  const handleImportedData = useCallback(
    async (data) => {
      try {
        const rowsToProcess = data.map((row) => ({
          ...row,
          id: row.id || randomId(),
          isNew: false,
        }));

        let finalRows = [];

        if (onSaveRowsBulk) {
          finalRows = await onSaveRowsBulk(rowsToProcess);
          triggerSnackbar(
            `${finalRows.length} lignes importées avec succès !`,
            "success",
          );
        } else if (onSaveRow) {
          const savePromises = rowsToProcess.map(
            async (row) => await onSaveRow(row),
          );
          finalRows = await Promise.all(savePromises);
          triggerSnackbar(
            `${finalRows.length} lignes sauvegardées !`,
            "success",
          );
        }

        // --- APPLICATION DU TRI IDENTIQUE AU BACKEND ---
        setRows((prevRows) => [...finalRows, ...prevRows]);
      } catch (error) {
        const details = error.response?.data?.details;
        if (details && Array.isArray(details)) {
          const maxErrors = 3;
          let message = details.slice(0, maxErrors).join("\n");
          if (details.length > maxErrors) {
            message += `\n... et ${details.length - maxErrors} autres erreurs.`;
          }
          triggerSnackbar(message, "error");
        } else {
          triggerSnackbar(
            error.response?.data?.message || "Erreur lors de l'import",
            "error",
          );
        }
      }
    },
    [onSaveRow, onSaveRowsBulk, triggerSnackbar],
  );

  return (
    <Box sx={{ ...gridStyle, ...(height ? { height } : {}) }}>
      <Dialog
        open={openDeleteDialog}
        onClose={handleCancelDelete}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleConfirmDelete();
          }
        }}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteConfirmMessage
              ? deleteConfirmMessage
              : <>Voulez-vous vraiment supprimer{" "}
                {getRowTypeLabel ? getRowTypeLabel(rowToDelete, columns) : "cet élément"}{" "}
                <strong>{nameValue}</strong> ?</>
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={dialogActionsStyle}>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
            Annuler
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            {isArchiveAction ? "Archiver" : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
      <DataGrid
        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        onColumnWidthChange={handleColumnWidthChange}
        editMode="row" // Premet d'éditer tous les champs d'une ligne
        density="compact"
        rowModesModel={rowModesModel} // état de la grille
        onRowModesModelChange={(newModel) => {
          setRowModesModel((prevModel) => {
            const updatedModel = { ...newModel };

            Object.keys(updatedModel).forEach((id) => {
              // Si MUI veut passer en edit mais n'a pas de champ (ex: clic externe bizarre)
              // et que nous avions déjà un champ prévu dans l'ancien état, on le garde.
              if (
                updatedModel[id].mode === GridRowModes.Edit &&
                !updatedModel[id].fieldToFocus &&
                prevModel[id]?.fieldToFocus
              ) {
                updatedModel[id].fieldToFocus = prevModel[id].fieldToFocus;
              }
            });

            return updatedModel;
          });
        }} // écroute les changements de la grille (actions utilisateurs)
        processRowUpdate={processRowUpdate} // Validation des données et mise à jour de l'état
        onRowEditStart={(params, event) => {
          if (isAnyRowEditing) {
            // Si une ligne est déjà en cours, on bloque l'ouverture de TOUTE autre ligne
            event.defaultMuiPrevented = true;
          }
        }}
        onRowEditStop={(params, event) => {
          // 1. Gestion du clic extérieur (on maintient l'édition avec erreurs)
          if (params.reason === "rowFocusOut") {
            event.defaultMuiPrevented = true;
            apiRef.current.setCellFocus(
              params.id,
              params.field || fieldFocusAdd,
            );
            setShowErrors(true);
          }

          // 2. Touche Entrée -> MUI va tenter de sauvegarder via processRowUpdate
          if (params.reason === "enterKeyDown") {
            // On laisse passer l'action pour que processRowUpdate soit appelé
          }

          // 3. Touche Échap -> On annule tout
          if (params.reason === "escapeKeyDown") {
            // On appelle ta fonction qui gère déjà la suppression si isNew
            handleCancelClick(params.id);
          }
        }}
        onCellKeyDown={handleCellKeyDown}
        // Remplace onRowDoubleClick par onCellDoubleClick
        onCellDoubleClick={(params, event) => {
          if (!isAnyRowEditing && !params.row.archive) {
            // On empêche le comportement par défaut de MUI
            // pour garder le contrôle sur le focus
            event.stopPropagation();

            // params.field contient ici "depenses", "date", etc.
            handleEditClick(params.id, params.field);
          } else {
            // Si une ligne est déjà en édition, on bloque
            event.defaultMuiPrevented = true;
          }
        }}
        getRowClassName={(params) => {
          if (params.row.archive) return "row-archived";
          if (!showErrors) return "";
          // On utilise la version "Live" pour que le rouge apparaisse pendant la saisie
          const errors = getLiveRowErrors(params.id);
          return Object.keys(errors).length > 0 ? "force-error-style" : "";
        }}
        onProcessRowUpdateError={(error) => {
          triggerSnackbar(
            "Erreur de saisie : veuillez vérifier les champs en rouge.",
            "error",
          );
        }}
        showToolbar
        slots={{
          toolbar: EditToolbar,
        }} // Remplacement de la barre d'outils standard par EditToolbar
        slotProps={{
          toolbar: {
            setRows,
            setRowModesModel,
            fieldFocusAdd,
            emptyRow,
            setShowErrors,
            addButtonLabel,
            isAnyRowEditing,
            columns,
            onDataParsed: handleImportedData,
            onToggleArchived,
            showArchived,
            archivedLabel,
          },
        }} // Fonctions injectés au slots EditToolbar
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000} // Un peu plus long pour laisser le temps de lire
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          elevation={6} // Ajoute une ombre portée
          sx={snackbarAlertStyle}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
