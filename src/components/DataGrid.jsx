import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { frFR } from '@mui/x-data-grid/locales';
import { gridStyle, addButtonStyle } from '../styles/GridStyles.js';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import {
    GridToolbarContainer,
    GridRowModes,
    DataGrid,
    GridRowEditStopReasons,
    GridActionsCellItem,
    useGridApiContext,
    useGridApiRef,
} from '@mui/x-data-grid';
import { randomId } from '@mui/x-data-grid-generator';
import { getRowErrors } from './utils/GridValidation.js';

function GridEditDateCell({ id, value, field, shouldAutoFocus, onCancel }) {
    const apiRef = useGridApiContext();

    const maxLimit = new Date();
    maxLimit.setHours(23, 59, 59, 999);

    const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());
    const dateValue = value && isValidDate(new Date(value)) ? new Date(value) : null;

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
                maxDate={maxLimit}
                localeText={{
                    todayButtonLabel: "Aujourd'hui",
                    clearButtonLabel: "Effacer",
                    cancelButtonLabel: "Annuler",
                }}
                slotProps={{
                    actionBar: { actions: ["today", "clear", "cancel"] },
                    field: {
                        onKeyDown: (event) => {
                            if (event.key === 'Escape') {
                                event.stopPropagation();
                                event.preventDefault();

                                let container = event.target;
                                while (container && !container.className?.includes?.('MuiPickersSectionList-root')) {
                                    container = container.parentElement;
                                }
                                const sections = container?.querySelectorAll('[role="spinbutton"]');
                                const values = sections ? Array.from(sections).map(s => s.getAttribute('aria-valuetext')) : [];
                                const estVide = values.every(v => v === 'Empty' || v === null);

                                if (!estVide) {
                                    apiRef.current.setEditCellValue({ id, field, value: null });
                                    sections && Array.from(sections).forEach((s, i) => {
                                        s.setAttribute('aria-valuetext', 'Empty');
                                        s.textContent = i === 0 ? 'DD' : i === 1 ? 'MM' : 'YYYY';
                                    });
                                    setTimeout(() => {
                                        const cell = apiRef.current.getCellElement(id, field);
                                        if (cell) cell.focus();
                                    }, 50);
                                } else {
                                    if (onCancel) onCancel(id);
                                }
                            }
                        },
                    },
                    textField: {
                        variant: "standard",
                        fullWidth: true,
                        autoFocus: shouldAutoFocus,
                        InputProps: { disableUnderline: true },
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

function EditToolbar({ setRows, setRowModesModel, addButtonLabel, emptyRow, fieldFocusAdd, isAnyRowEditing, setShowErrors }) {
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
        </GridToolbarContainer>
    );
}

export default function FullFeaturedCrudGrid({
    columns: customColumns,
    initialRows = [],
    addButtonLabel,
    fieldFocusEdit = null,
    validateRow = null,
}) {
    const apiRef = useGridApiRef();
    const [rows, setRows] = React.useState(initialRows);
    const [rowModesModel, setRowModesModel] = React.useState({});
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [rowToDelete, setRowToDelete] = React.useState(null);
    const [showErrors, setShowErrors] = React.useState(false);

    const isDeleteDialogOpenRef = React.useRef(false);
    const lastChequeEnCoursRef = React.useRef(null);

    const isAnyRowEditing = Object.values(rowModesModel).some(
        (row) => row.mode === GridRowModes.Edit
    );

    // Ligne vide générée depuis les colonnes
    const emptyRow = React.useMemo(() => {
        const obj = {};
        customColumns.forEach((col) => {
            if (col.type === 'number') obj[col.field] = 0;
            else if (col.type === 'boolean') obj[col.field] = false;
            else obj[col.field] = '';
        });
        return obj;
    }, [customColumns]);

    // Premier champ focusable
    const fieldFocusAdd = React.useMemo(
        () => customColumns.find((col) => col.isInitialFocus)?.field || customColumns[0]?.field,
        [customColumns]
    );

    // Fix MUI v8 : forcer le re-render de la ligne quand une checkbox change
    React.useEffect(() => {
        if (!apiRef.current) return;
        const unsubscribe = apiRef.current.store.subscribe(() => {
            const editRows = apiRef.current.state.editRows;
            const editingId = Object.keys(editRows)[0];
            if (!editingId || !showErrors) return;
            const chequeEnCours = editRows[editingId]?.chequeEnCours?.value;
            if (chequeEnCours === undefined) return;
            if (chequeEnCours === lastChequeEnCoursRef.current) return;
            lastChequeEnCoursRef.current = chequeEnCours;
            setTimeout(() => {
                apiRef.current.updateRows([{ id: editingId }]);
            }, 0);
        });
        return () => unsubscribe();
    }, [apiRef, showErrors]);

    const handleEditClick = React.useCallback((id) => {
        setShowErrors(false);
        setRowModesModel((prev) => ({
            ...prev,
            [id]: { mode: GridRowModes.Edit, fieldToFocus: fieldFocusEdit || customColumns[0]?.field }
        }));
        setTimeout(() => {
            const cell = apiRef.current.getCellElement(id, fieldFocusEdit || customColumns[0]?.field);
            const input = cell?.querySelector('input');
            if (input) { input.focus(); input.select(); }
        }, 50);
    }, [fieldFocusEdit, customColumns, apiRef]);

    const handleRowEditStop = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
        if (params.reason === GridRowEditStopReasons.escapeKeyDown) {
            event.defaultMuiPrevented = true;
            handleCancelClick(params.id);
        }
    };

    const handleSaveClick = (id) => {
        setRowModesModel((prev) => ({ ...prev, [id]: { mode: GridRowModes.View } }));
    };

    const handleDeleteClick = React.useCallback((id) => {
        const row = rows.find((r) => r.id === id);
        setRowToDelete(row);
        isDeleteDialogOpenRef.current = true;
        setOpenDeleteDialog(true);
    }, [rows]);

    const handleConfirmDelete = () => {
        if (rowToDelete) {
            setRows((prev) => prev.filter((row) => row.id !== rowToDelete.id));
            isDeleteDialogOpenRef.current = false;
            setOpenDeleteDialog(false);
            setRowToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        isDeleteDialogOpenRef.current = false;
        setOpenDeleteDialog(false);
        setRowToDelete(null);
    };

    const handleCancelClick = (id) => {
        setShowErrors(false);
        setRows((prev) => {
            const editedRow = prev.find((row) => row.id === id);
            if (editedRow?.isNew) {
                setRowModesModel((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
                return prev.filter((row) => row.id !== id);
            }
            setRowModesModel((prev) => ({
                ...prev,
                [id]: { mode: GridRowModes.View, ignoreModifications: true },
            }));
            return prev;
        });
    };

    const processRowUpdate = (newRow, oldRow) => {
        // Si la ligne n'existe plus (annulation d'une nouvelle ligne)
        const rowExists = rows.find((row) => row.id === newRow.id);
        if (!rowExists) return oldRow;

        const errors = getRowErrors(newRow, columns, validateRow);
        const hasError = Object.keys(errors).length > 0;

        if (hasError) {
            setShowErrors(true);
            const messages = columns
                .filter(col => errors[col.field] && typeof errors[col.field] === 'string')
                .map(col => errors[col.field])
                .join(' · ');
            const error = new Error(messages || "Validation échouée");
            error.isValidationError = true;
            throw error;
        }

        setShowErrors(false);
        const updatedRow = { ...newRow, isNew: false };
        setRows((prev) => prev.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    // Colonnes avec cellClassName et renderEditCell
    const columns = React.useMemo(() => [
        ...customColumns.map((col) => {
            return {
                ...col,
                cellClassName: (params) => {
                    if (!showErrors) return col.cellClassName || "";
                    const editRowsState = apiRef.current?.state?.editRows;
                    const editingRowState = editRowsState?.[params.id];
                    const row = apiRef.current?.getRow(params.id) || {};
                    const liveRow = { ...row };
                    if (editingRowState) {
                        Object.keys(editingRowState).forEach((field) => {
                            liveRow[field] = editingRowState[field].value;
                        });
                    }
                    const errors = getRowErrors(liveRow, customColumns, validateRow);
                    return errors[col.field] ? "cell-error" : col.cellClassName || "";
                },
                ...(col.type === 'date' ? {
                    renderEditCell: (params) => (
                        <GridEditDateCell
                            {...params}
                            shouldAutoFocus={rowModesModel[params.id]?.fieldToFocus === col.field}
                            onCancel={handleCancelClick}
                        />
                    ),
                } : {}),
            };
        }),
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            getActions: ({ id }) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
                if (isInEditMode) {
                    return [
                        <GridActionsCellItem icon={<SaveIcon />} label="Save" onClick={() => handleSaveClick(id)} sx={{ color: 'primary.main' }} />,
                        <GridActionsCellItem icon={<CancelIcon />} label="Cancel" onClick={() => handleCancelClick(id)} color="inherit" />,
                    ];
                }
                return [
                    <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => handleEditClick(id)} color="inherit" />,
                    <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => handleDeleteClick(id)} color="inherit" />,
                ];
            },
        },
    ], [customColumns, rowModesModel, handleEditClick, handleDeleteClick, apiRef, showErrors, validateRow]);

    return (
        <Box sx={{ height: 500, width: '100%', ...gridStyle }}>
            <Dialog
                open={openDeleteDialog}
                onClose={handleCancelDelete}
                transitionDuration={0}
                sx={{
                    '& .MuiDialog-paper': { outline: 'none' },
                    '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        handleConfirmDelete();
                    }
                }}
            >
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Voulez-vous vraiment supprimer <strong>{rowToDelete?.description}</strong> ?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="inherit">Annuler</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
            <DataGrid
                localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                apiRef={apiRef}
                rows={rows}
                columns={columns}
                editMode="row"
                density="compact"
                rowModesModel={rowModesModel}
                onRowModesModelChange={setRowModesModel}
                onRowEditStop={handleRowEditStop}
                onRowEditStart={(params, event) => {
                    if (isDeleteDialogOpenRef.current || isAnyRowEditing) {
                        event.defaultMuiPrevented = true;
                    }
                }}
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={(error) => {
                    console.log("🔍 erreur validation:", error.message);
                }}
                onCellDoubleClick={(params, event) => {
                    if (!isAnyRowEditing) {
                        event.stopPropagation();
                        setShowErrors(false);
                        setRowModesModel((prev) => ({
                            ...prev,
                            [params.id]: { mode: GridRowModes.Edit, fieldToFocus: params.field },
                        }));
                        setTimeout(() => {
                            const cell = apiRef.current.getCellElement(params.id, params.field);
                            if (params.colDef.type === 'date') {
                                const firstSection = cell?.querySelector('[role="spinbutton"]');
                                if (firstSection) firstSection.focus();
                            } else {
                                const input = cell?.querySelector('input');
                                if (input) { input.focus(); input.select(); }
                            }
                        }, 50);
                    }
                }}
                onCellKeyDown={(params, event) => {
                    if (event.key === "Delete" && !rowModesModel[params.id]) {
                        event.preventDefault();
                        handleDeleteClick(params.id);
                        return;
                    }
                    if (event.key === "Escape" && rowModesModel[params.id]?.mode === GridRowModes.Edit && params.colDef.type !== 'date') {
                        event.preventDefault();
                        event.stopPropagation();
                        event.defaultMuiPrevented = true;

                        const originalRow = apiRef.current.getRow(params.id);
                        const currentRow = apiRef.current.getRowWithUpdatedValues(params.id, params.field);
                        const currentValue = currentRow[params.field];
                        const originalValue = originalRow[params.field];
                        const isNew = originalRow.isNew;

                        // Valeur vide = null, undefined, "" ou 0
                        const isEmpty = currentValue === null || currentValue === undefined || String(currentValue).trim() === "" || currentValue === 0;
                        // Valeur originale vide = même condition

                        if (isNew) {
                            // Nouvelle ligne : vide le champ si pas vide, sinon annule
                            if (!isEmpty) {
                                apiRef.current.setEditCellValue({ id: params.id, field: params.field, value: params.colDef.type === 'number' ? 0 : '' });
                            } else {
                                handleCancelClick(params.id);
                            }
                        } else {
                            // Ligne existante : remet la valeur originale si modifiée, sinon annule
                            if (currentValue !== originalValue) {
                                apiRef.current.setEditCellValue({ id: params.id, field: params.field, value: originalValue });
                                setTimeout(() => {
                                    const cell = apiRef.current.getCellElement(params.id, params.field);
                                    const input = cell?.querySelector('input');
                                    if (input) { input.focus(); input.select(); }
                                }, 20);
                            } else {
                                handleCancelClick(params.id);
                            }
                        }
                        return;
                    }
                    if (event.key === "Enter" && rowModesModel[params.id]?.mode === GridRowModes.Edit && params.colDef.type === 'boolean') {
                        event.preventDefault();
                        event.stopPropagation();
                        event.defaultMuiPrevented = true;
                        const row = apiRef.current.getRowWithUpdatedValues(params.id, params.field);
                        apiRef.current.setEditCellValue({ id: params.id, field: params.field, value: !row[params.field] });
                        return;
                    }
                    if (event.key === "Enter" && rowModesModel[params.id]?.mode !== GridRowModes.Edit) {
                        event.preventDefault();
                        event.stopPropagation();
                        setShowErrors(false);
                        setRowModesModel((prev) => ({
                            ...prev,
                            [params.id]: { mode: GridRowModes.Edit, fieldToFocus: params.field },
                        }));
                        setTimeout(() => {
                            const cell = apiRef.current.getCellElement(params.id, params.field);
                            if (params.colDef.type === 'date') {
                                const firstSection = cell?.querySelector('[role="spinbutton"]');
                                if (firstSection) firstSection.focus();
                            } else {
                                const input = cell?.querySelector('input');
                                if (input) { input.focus(); input.select(); }
                            }
                        }, 50);
                        return;
                    }
                    if (event.key === "Enter" && rowModesModel[params.id]?.mode === GridRowModes.Edit) {
                        event.preventDefault();
                        event.stopPropagation();
                        handleSaveClick(params.id);
                        return;
                    }
                    if (event.key === "Tab" && rowModesModel[params.id]?.mode === GridRowModes.Edit) {
                        const columnFields = columns
                            .map((c) => c.field)
                            .filter((f) => f !== "actions");
                        const firstField = columnFields[0];

                        if (params.field !== "actions" && !event.shiftKey) {
                            const currentIndex = columnFields.indexOf(params.field);
                            const nextField = columnFields[currentIndex + 1] || "actions";

                            event.preventDefault();
                            event.stopPropagation();

                            apiRef.current.setCellFocus(params.id, nextField);

                            setTimeout(() => {
                                const nextCell = apiRef.current.getCellElement(params.id, nextField);
                                const input = nextCell?.querySelector("input");
                                if (input) {
                                    input.focus();
                                    input.select();
                                }
                            }, 20);
                            return;
                        }

                        if (params.field === "actions" && !event.shiftKey) {
                            const actionCell = apiRef.current.getCellElement(params.id, "actions");
                            const buttons = actionCell ? Array.from(actionCell.querySelectorAll("button")) : [];
                            const saveButton = buttons[0];
                            const cancelButton = buttons[1];

                            if (event.target === saveButton && cancelButton) {
                                event.preventDefault();
                                event.stopPropagation();
                                cancelButton.focus();
                                return;
                            }

                            if (event.target === cancelButton || buttons.length <= 1) {
                                event.preventDefault();
                                event.stopPropagation();
                                apiRef.current.setCellFocus(params.id, firstField);
                            }
                        }
                    }
                }}
                showToolbar
                slots={{ toolbar: EditToolbar }}
                slotProps={{
                    toolbar: { setRows, setRowModesModel, addButtonLabel, emptyRow, fieldFocusAdd, isAnyRowEditing, setShowErrors },
                }}
            />
        </Box>
    );
}