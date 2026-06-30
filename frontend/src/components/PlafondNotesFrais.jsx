import { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AppDatePicker } from './utils/AppDatePicker.jsx';
import { AppSnackbar } from './utils/AppSnackbar.jsx';
import { useAppSnackbar } from '../hooks/useAppSnackbar.js';
import { validateDate, validateMontantPositif } from './utils/validators.js';
import { fetchPlafonds, ajouterPlafond } from '../api/plafondNotesFrais.js';

const VIDE = { repas: [], hotelPDJ: [], soireeEtape: [] };

const plafondActuel = (entrees = []) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return entrees.find(e => new Date(e.dateEffet) <= today) ?? null;
};

const afficherMontant = (entree) =>
    entree ? `${entree.montantMax.toFixed(2)} €` : 'Aucun';

export default function PlafondNotesFrais() {
    const { snackbar, show: showSnackbar, handleClose: handleCloseSnackbar } = useAppSnackbar();
    const [plafonds, setPlafonds] = useState(VIDE);
    const [loading, setLoading] = useState(true);
    const [globalError, setGlobalError] = useState('');

    const [repasMontant, setRepasMontant] = useState('');
    const [repasDate, setRepasDate] = useState(null);
    const [repasErrors, setRepasErrors] = useState({});
    const [repasSaving, setRepasSaving] = useState(false);

    const [hotelMontant, setHotelMontant] = useState('');
    const [hotelDate, setHotelDate] = useState(null);
    const [hotelPDJChecked, setHotelPDJChecked] = useState(true);
    const [soireeEtapeChecked, setSoireeEtapeChecked] = useState(false);
    const [hotelErrors, setHotelErrors] = useState({});
    const [hotelSaving, setHotelSaving] = useState(false);

    useEffect(() => {
        fetchPlafonds()
            .then(setPlafonds)
            .catch(() => setGlobalError('Impossible de charger les plafonds'))
            .finally(() => setLoading(false));
    }, []);

    const handleSaveRepas = async () => {
        const errs = {};
        const errMontant = validateMontantPositif(repasMontant);
        if (errMontant) errs.montant = errMontant;
        const errDate = validateDate(repasDate);
        if (errDate) errs.date = errDate;
        if (Object.keys(errs).length) { setRepasErrors(errs); return; }
        setRepasErrors({});
        setRepasSaving(true);
        try {
            const updated = await ajouterPlafond('repas', parseFloat(repasMontant), repasDate);
            setPlafonds(updated);
            setRepasMontant('');
            setRepasDate(null);
            showSnackbar('Plafond repas enregistré');
        } catch (err) {
            showSnackbar(err.message || 'Erreur lors de la sauvegarde', 'error');
        } finally {
            setRepasSaving(false);
        }
    };

    const handleSaveHotel = async () => {
        const errs = {};
        const errMontant = validateMontantPositif(hotelMontant);
        if (errMontant) errs.montant = errMontant;
        const errDate = validateDate(hotelDate);
        if (errDate) errs.date = errDate;
        if (!hotelPDJChecked && !soireeEtapeChecked) errs.types = 'Sélectionnez au moins un type';
        if (Object.keys(errs).length) { setHotelErrors(errs); return; }
        setHotelErrors({});
        setHotelSaving(true);
        try {
            const types = [...(hotelPDJChecked ? ['hotelPDJ'] : []), ...(soireeEtapeChecked ? ['soireeEtape'] : [])];
            let updated = plafonds;
            for (const type of types) {
                updated = await ajouterPlafond(type, parseFloat(hotelMontant), hotelDate);
            }
            setPlafonds(updated);
            setHotelMontant('');
            setHotelDate(null);
            showSnackbar('Plafond hôtel enregistré');
        } catch (err) {
            showSnackbar(err.message || 'Erreur lors de la sauvegarde', 'error');
        } finally {
            setHotelSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (globalError) {
        return <Box sx={{ p: 3 }}><Alert severity="error">{globalError}</Alert></Box>;
    }

    const currentRepas = plafondActuel(plafonds.repas);
    const currentHotelPDJ = plafondActuel(plafonds.hotelPDJ);
    const currentSoireeEtape = plafondActuel(plafonds.soireeEtape);

    return (
        <Box sx={{ p: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>

            {/* ── Midi et soir ── */}
            <Paper variant="outlined" sx={{ flex: '1 1 340px', p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" align="center">
                    Midi et soir
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                    Plafond actuel : {afficherMontant(currentRepas)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <TextField
                        label="Nouveau montant max (€)"
                        size="small"
                        type="number"
                        placeholder="ex : 22.00"
                        value={repasMontant}
                        onChange={e => { setRepasMontant(e.target.value); setRepasErrors(p => ({ ...p, montant: undefined })); }}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveRepas(); if (e.key === 'Escape') { setRepasMontant(''); setRepasDate(null); setRepasErrors({}); } }}
                        error={!!repasErrors.montant}
                        helperText={repasErrors.montant}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0, step: 0.01 } }}
                        sx={{ width: 200 }}
                    />
                    <Box sx={{ width: 180 }}>
                        <AppDatePicker
                            value={repasDate}
                            onChange={v => { setRepasDate(v); setRepasErrors(p => ({ ...p, date: undefined })); }}
                            onSave={handleSaveRepas}
                            onCancel={() => { setRepasDate(null); setRepasErrors(p => ({ ...p, date: undefined })); }}
                            error={!!repasErrors.date}
                            helperText={repasErrors.date}
                        />
                    </Box>
                    <Button
                        variant="contained"
                        onClick={handleSaveRepas}
                        disabled={repasSaving}
                        sx={{ height: 40, alignSelf: 'flex-start', mt: 0.5 }}
                    >
                        Enregistrer
                    </Button>
                </Box>
            </Paper>

            {/* ── Hôtel ── */}
            <Paper variant="outlined" sx={{ flex: '1 1 340px', p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" align="center">
                    Hôtel
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                    Hôtel + pdj : <strong>{afficherMontant(currentHotelPDJ)}</strong>
                    &nbsp;&nbsp;Soirée étape : <strong>{afficherMontant(currentSoireeEtape)}</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <TextField
                        label="Nouveau montant max (€)"
                        size="small"
                        type="number"
                        placeholder="ex : 120.00"
                        value={hotelMontant}
                        onChange={e => { setHotelMontant(e.target.value); setHotelErrors(p => ({ ...p, montant: undefined })); }}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveHotel(); if (e.key === 'Escape') { setHotelMontant(''); setHotelDate(null); setHotelErrors({}); } }}
                        error={!!hotelErrors.montant}
                        helperText={hotelErrors.montant}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0, step: 0.01 } }}
                        sx={{ width: 200 }}
                    />
                    <Box sx={{ width: 180 }}>
                        <AppDatePicker
                            value={hotelDate}
                            onChange={v => { setHotelDate(v); setHotelErrors(p => ({ ...p, date: undefined })); }}
                            onSave={handleSaveHotel}
                            onCancel={() => { setHotelDate(null); setHotelErrors(p => ({ ...p, date: undefined })); }}
                            error={!!hotelErrors.date}
                            helperText={hotelErrors.date}
                        />
                    </Box>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={hotelPDJChecked}
                                onChange={e => { setHotelPDJChecked(e.target.checked); setHotelErrors(p => ({ ...p, types: undefined })); }}
                                size="small"
                            />
                        }
                        label="Hôtel + pdj"
                        sx={{ mr: 0 }}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={soireeEtapeChecked}
                                onChange={e => { setSoireeEtapeChecked(e.target.checked); setHotelErrors(p => ({ ...p, types: undefined })); }}
                                size="small"
                            />
                        }
                        label="Soirée étape"
                        sx={{ mr: 0 }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSaveHotel}
                        disabled={hotelSaving}
                        sx={{ height: 40, alignSelf: 'flex-start', mt: 0.5 }}
                    >
                        Enregistrer
                    </Button>
                </Box>
                {hotelErrors.types && <Alert severity="warning" sx={{ mt: 1.5 }}>{hotelErrors.types}</Alert>}
            </Paper>

            <AppSnackbar snackbar={snackbar} onClose={handleCloseSnackbar} />
        </Box>
    );
}
