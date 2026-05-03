import { Box, Card, CardContent, Typography, Stack, Divider } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import {
    statCardHeaderStyle,
    statCardRowStyle,
    statCardInstantTStyle,
} from './styles/StatCardsStyles.js';

export default function StatCardCompteJoint({ stats, global, nomCompte, valueFormatter, monthLabel }) {
    if (!stats || stats.length === 0 || !global) return null;

    const colorGlobal = global.soldeInstantT >= 0 ? "success.main" : "error.main";

    const ColonneStats = ({ data, titre }) => {
        const color = data.soldeInstantT >= 0 ? "success.main" : "error.main";
        return (
            <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    {titre}
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    <Box sx={statCardRowStyle}>
                        <Typography variant="caption" color="text.secondary">
                            {monthLabel || "Mois en cours"} :
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                            {valueFormatter(data.moisEnCoursDepenses)}
                        </Typography>
                    </Box>
                    <Box sx={statCardRowStyle}>
                        <Typography variant="caption" color="text.secondary">Solde théorique :</Typography>
                        <Typography variant="caption" sx={{ fontWeight: "bold", color: "warning.dark" }}>
                            {valueFormatter(data.soldeTotal)}
                        </Typography>
                    </Box>
                    <Box sx={statCardInstantTStyle}>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>Instant T :</Typography>
                        <Typography variant="body2" sx={{ fontWeight: "900", color }}>
                            {valueFormatter(data.soldeInstantT)}
                        </Typography>
                    </Box>
                </Stack>
            </Box>
        );
    };

    return (
        <Box sx={{ flex: '1 1 500px' }}>
            <Card sx={{
                borderRadius: 2,
                boxShadow: 2,
                borderTop: '4px solid',
                borderColor: colorGlobal,
                height: '100%'
            }}>
                <CardContent>
                    <Box sx={statCardHeaderStyle}>
                        <AccountBalanceWalletIcon color="action" fontSize="small" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {nomCompte}
                        </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <ColonneStats data={global} titre="Global" />
                        <Divider orientation="vertical" flexItem />
                        {stats.map((personne, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 2, flex: 1 }}>
                                {index > 0 && <Divider orientation="vertical" flexItem />}
                                <ColonneStats
                                    data={personne}
                                    titre={personne.nom || `Personne ${index + 1}`}
                                />
                            </Box>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}