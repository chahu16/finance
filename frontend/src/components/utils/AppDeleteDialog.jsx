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
