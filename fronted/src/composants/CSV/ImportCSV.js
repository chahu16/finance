import Papa from 'papaparse';
import { useRef } from "react";
import Button from "@mui/material/Button";
import { addButtonStyle } from "../styles/GridStyles.js";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const ImportCSV = ({ onDataParsed, columns, disabled }) => {
    const inputIdRef = useRef(`csv-upload-${Math.random().toString(36).slice(2)}`);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false, // On garde false pour nettoyer nous-mêmes
            complete: (results) => {
                const cleanedData = results.data.map((row) => {
                    const newRow = {};

                    // 1. Normalisation des clés du CSV (pour être insensible à la casse et aux espaces)
                    const normalizedRow = {};
                    Object.keys(row).forEach(key => {
                        normalizedRow[key.trim().toLowerCase()] = row[key];
                    });

                    // 2. Mapping basé sur la configuration de tes colonnes DataGrid
                    columns.forEach((col) => {
                        if (!col.field || col.field === 'actions') return;

                        const fieldKey = col.field.toLowerCase();
                        const headerKey = col.headerName ? col.headerName.toLowerCase() : "";

                        // On cherche la valeur avec plusieurs alias possibles
                        let value = normalizedRow[fieldKey] || normalizedRow[headerKey];

                        // Corrections spécifiques (alias courants dans tes fichiers)
                        if (value === undefined) {
                            if (fieldKey === 'notedefrais') value = normalizedRow['notesfrais'] || normalizedRow['ndf'];
                            if (fieldKey === 'rembourser') value = normalizedRow['remboursee'];
                            if (fieldKey === 'parts_0') value = normalizedRow['parts'];
                        }

                        newRow[col.field] = value ?? "";
                    });
                    return newRow;
                });

                if (onDataParsed) onDataParsed(cleanedData);
            }
        });
        // Reset l'input pour pouvoir ré-importer le même fichier si besoin
        event.target.value = "";
    };

    return (
        <div style={{ display: 'inline-block' }}>
            <input
                type="file"
                accept=".csv"
                id={inputIdRef.current}
                hidden
                onChange={handleFileChange}
                disabled={disabled}
            />
            <Button
                color="primary"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                disabled={disabled}
                onClick={() => document.getElementById(inputIdRef.current).click()}
                sx={{
                    ...addButtonStyle,
                    textTransform: "none"
                }}
                size="small"
            >
                Importer CSV
            </Button>
        </div>
    );
};

export default ImportCSV;