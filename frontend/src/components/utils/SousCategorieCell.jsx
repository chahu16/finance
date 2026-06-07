import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useGridApiContext } from '@mui/x-data-grid';

export function GridEditSousCategorieCell({ id, field, value, hasFocus, categoriesRows, transactionType }) {
    const apiRef = useGridApiContext();

    const options = React.useMemo(() =>
        categoriesRows
            .filter(c => c.type === transactionType)
            .map(c => ({ value: c.id, label: c.nom, groupe: c.groupe }))
            .sort((a, b) => a.groupe.localeCompare(b.groupe, 'fr') || a.label.localeCompare(b.label, 'fr')),
        [categoriesRows, transactionType]
    );

    const currentValue = options.find(o => o.value === value) ?? null;

    const handleChange = (_, newValue) => {
        apiRef.current.setEditCellValue({ id, field, value: newValue?.value ?? '' });
        apiRef.current.setEditCellValue({ id, field: 'categorie', value: newValue?.groupe ?? '' });
    };

    return (
        <Autocomplete
            autoHighlight
            openOnFocus
            fullWidth
            options={options}
            groupBy={(option) => option.groupe}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
            isOptionEqualToValue={(option, val) => option.value === val.value}
            value={currentValue}
            onChange={handleChange}
            size="small"
            renderInput={(params) => (
                <TextField
                    {...params}
                    autoFocus={hasFocus}
                    variant="standard"
                    InputProps={{ ...params.InputProps, disableUnderline: true }}
                    sx={{ px: 1 }}
                />
            )}
        />
    );
}
