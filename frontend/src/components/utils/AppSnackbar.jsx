import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export function AppSnackbar({ snackbar, onClose }) {
    return (
        <Snackbar
            key={snackbar.key}
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
