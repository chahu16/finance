import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import {
    cardSx, headerSx, iconSx, titleSx,
    rowSx, labelSx, valueSx, valueTheoSx,
    dividerSx, instantRowSx, instantLabelSx, instantValueSx,
} from '../styles/StatCardStyles.js';

const fmtEuro = (value) =>
    `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function StatCard({ compte, rows }) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthName = now.toLocaleString('fr-FR', { month: 'long' });
    const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const moisCourant = rows
        .filter(r => {
            if (!r.dateDepensesRecettes) return false;
            const d = new Date(r.dateDepensesRecettes);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((acc, r) => acc + (r.recettes || 0) - (r.depenses || 0), 0);

    const soldeTheorique = rows
        .reduce((acc, r) => acc + (r.recettes || 0) - (r.depenses || 0), 0);

    const instantT = rows
        .filter(r => r.dateDepensesRecettes != null)
        .reduce((acc, r) => acc + (r.recettes || 0) - (r.depenses || 0), 0);

    return (
        <Box sx={cardSx}>
            <Box sx={headerSx}>
                <AccountBalanceIcon sx={iconSx} />
                <Typography sx={titleSx}>{compte}</Typography>
            </Box>
            <Box sx={rowSx}>
                <Typography sx={labelSx}>Mois de {monthLabel} :</Typography>
                <Typography sx={valueSx}>{fmtEuro(moisCourant)}</Typography>
            </Box>
            <Box sx={rowSx}>
                <Typography sx={labelSx}>Solde théorique :</Typography>
                <Typography sx={valueTheoSx}>{fmtEuro(soldeTheorique)}</Typography>
            </Box>
            <Divider sx={dividerSx} />
            <Box sx={instantRowSx}>
                <Typography sx={instantLabelSx}>Instant T :</Typography>
                <Typography sx={instantValueSx}>{fmtEuro(instantT)}</Typography>
            </Box>
        </Box>
    );
}

export default StatCard;
