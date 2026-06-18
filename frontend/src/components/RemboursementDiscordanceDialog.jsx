import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

const fmt = (n) => (n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '–';

export default function RemboursementDiscordanceDialog({ info, onClose }) {
    if (!info) return null;

    const { montant, updated, discordance } = info;
    const totalRembourse = updated.reduce((s, r) => s + (r.depenses - (r.depassementPlafond ?? r.depenseReelle ?? 0)), 0);

    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Remboursement — Notes de frais</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <Typography variant="body2">
                        Total perçu (cumul) : <strong>{fmt(montant)}</strong>
                    </Typography>

                    <Divider />

                    {updated.length > 0 ? (
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                {updated.length} note{updated.length > 1 ? 's' : ''} remboursée{updated.length > 1 ? 's' : ''} —{' '}
                                Total : <strong>{fmt(totalRembourse)}</strong>
                            </Typography>
                            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                                {updated.map((r) => {
                                    const montantRembourse = r.depenses - (r.depassementPlafond ?? r.depenseReelle ?? 0);
                                    return (
                                        <Box component="li" key={r.id}>
                                            <Typography variant="body2">
                                                {fmtDate(r.dateDepensesRecettes)} — {r.description} ({fmt(montantRembourse)})
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            Aucune note de frais trouvée.
                        </Typography>
                    )}

                    {discordance?.type === 'insuffisant' && (
                        <Alert severity="warning">
                            Manque <strong>{fmt(discordance.manque)}</strong> pour couvrir la/les prochaine(s) note(s) :
                            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
                                {(discordance.notesRestantes ?? [discordance.prochaineNote]).map((n, i) => (
                                    <Box component="li" key={i}>
                                        «&nbsp;{n.description}&nbsp;» du {fmtDate(n.date)} ({fmt(n.depenses)})
                                    </Box>
                                ))}
                            </Box>
                        </Alert>
                    )}

                    {discordance?.type === 'excedent' && (
                        <Alert severity="info">
                            Excédent de <strong>{fmt(discordance.restant)}</strong> —{' '}
                            {updated.length === 0
                                ? 'aucune note de frais en attente de remboursement.'
                                : 'toutes les notes de frais en attente sont couvertes.'}
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">OK</Button>
            </DialogActions>
        </Dialog>
    );
}
