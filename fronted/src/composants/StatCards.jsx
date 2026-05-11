import { Box, Card, CardContent, Typography, Stack, Divider } from "@mui/material";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {
    statCardEmptyStyle,
    statCardHeaderStyle,
    statCardInstantTStyle,
    statCardItemStyle,
    statCardRowStyle
} from './styles/StatCardsStyles.js';

/**
 * ============================================================
 * COMPOSANT DE PRÉSENTATION : STATCARDS
 * ============================================================
 * Affiche une grille de cartes synthétiques par compte bancaire.
 * @param {Object} data - Données calculées { 'Nom': { moisEnCoursDepenses, soldeTotal, soldeInstantT } }
 * @param {Function} valueFormatter - Formateur monétaire (ex: Config.js)
 * @param {Function} getStyles - Détermine les couleurs selon le solde
 * @param {String} monthLabel - Libellé dynamique du mois (ex: "Mois de Février")
 */
export default function StatCards({
    data,
    valueFormatter,
    getStyles,
    monthLabel
}) {

    // --- ÉTAT : AUCUNE DONNÉE ---
    // Affiche un message discret si le tableau est vide
    if (!data || Object.keys(data).length === 0) {
        return (
            <Box sx={statCardEmptyStyle}>
                <Typography variant="body2" color="text.secondary">
                    Aucune donnée à afficher pour le moment.
                </Typography>
            </Box>
        );
    }

    // --- ÉTAT : AFFICHAGE DES CARTES ---
    return (
        <>
            {Object.entries(data)
                // Tri alphabétique des comptes pour un affichage stable
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([name, stats]) => {
                    // Récupération des styles dynamiques (couleurs success/error)
                    const styles = getStyles ? getStyles(stats) : {};

                    return (
                        <Box key={name} sx={statCardItemStyle}>
                            <Card sx={styles.card || { borderRadius: 2, boxShadow: 2 }}>
                                <CardContent>

                                    {/* 1. EN-TÊTE DE LA CARTE (Nom du compte) */}
                                    <Box sx={statCardHeaderStyle}>
                                        <AccountBalanceWalletIcon color="action" fontSize="small" />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {name}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ my: 1 }} />

                                    {/* 2. DÉTAILS FINANCIERS (Lignes secondaires) */}
                                    <Stack spacing={0.5}>

                                        {/* Dépenses du mois en cours */}
                                        <Box sx={statCardRowStyle}>
                                            <Typography variant="caption" color="text.secondary">
                                                {monthLabel || "Mois en cours"} :
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                                                {valueFormatter(stats.moisEnCoursDepenses)}
                                            </Typography>
                                        </Box>

                                        {/* Solde théorique (Comptable) */}
                                        <Box sx={statCardRowStyle}>
                                            <Typography variant="caption" color="text.secondary">Solde théorique :</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: "bold", color: "warning.dark" }}>
                                                {valueFormatter(stats.soldeTotal)}
                                            </Typography>
                                        </Box>

                                        {/* 3. SECTION INSTANT T (Mise en avant visuelle) */}
                                        {/* Reflète l'état réel de la banque (hors chèques) */}
                                        <Box sx={statCardInstantTStyle}>
                                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>Instant T :</Typography>
                                            <Typography variant="body2" sx={{
                                                fontWeight: "900",
                                                color: styles.instantTColor || "text.primary"
                                            }}>
                                                {valueFormatter(stats.soldeInstantT)}
                                            </Typography>
                                        </Box>

                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>
                    );
                })}
        </>
    );
}