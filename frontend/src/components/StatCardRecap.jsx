import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/Person';
import { formatEuro } from './config/Config.js';
import {
    recapCardSx, recapHeaderSx, recapIconSx, recapTitleSx,
    recapSectionsSx, recapSectionSx, recapSectionLabelSx, recapBigValueSx,
    recapVerticalDividerSx, recapSubItemsRowSx, recapSubItemSx,
    recapSubLabelSx, recapSubValueSx, recapSubValuePositiveSx, recapSubValueNegativeSx,
} from '../styles/StatCardRecapStyles.js';

function StatCardRecap({ comptesData, rowsByCompte, virementInternesRows, compteJointData, compteJointConfig }) {
    const stats = useMemo(() => {
        let totalInstantT = 0;
        let totalTheorique = 0;
        let totalDepenses12m = 0;
        let totalRecettes12m = 0;

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const virNetForCompte = (nom, dateOnly) => {
            const source = dateOnly
                ? virementInternesRows.filter(v => v.dateVirement != null)
                : virementInternesRows;
            return source.reduce((acc, v) => {
                if (v.compteDestination === nom) return acc + (v.montant || 0);
                if (v.compteSource === nom) return acc - (v.montant || 0);
                return acc;
            }, 0);
        };

        for (const compte of comptesData) {
            const rows = rowsByCompte[compte.nomCompte] ?? [];
            const si = compte.soldeInitial ?? 0;
            const sdc = compte.sommeDeCote ?? 0;
            const nom = compte.nomCompte;
            const net = (r) => (r.recettes || 0) - (r.depenses || 0);

            totalInstantT  += si + rows.filter(r => r.dateDepensesRecettes != null).reduce((a, r) => a + net(r), 0) + virNetForCompte(nom, true)  - sdc;
            totalTheorique += si + rows.reduce((a, r) => a + net(r), 0)                                             + virNetForCompte(nom, false) - sdc;

            rows
                .filter(r => !r.depenseRecettesAMasquer && r.dateDepensesRecettes && new Date(r.dateDepensesRecettes) >= twelveMonthsAgo)
                .forEach(r => {
                    totalDepenses12m += r.depenses || 0;
                    totalRecettes12m += r.recettes || 0;
                });
        }

        // Compte joint — part moi uniquement
        if (compteJointData?.soldeInitial != null) {
            const nom = compteJointData.nomCompte;
            const rows = rowsByCompte[nom] ?? [];
            const si = compteJointData.soldeInitial ?? 0;
            const sdc = compteJointData.sommeDeCote ?? 0;
            const pctSI = (compteJointConfig.pourcentageSoldeInitialMoi ?? compteJointConfig.pourcentageDefaut ?? 50) / 100;
            const pMoi = (r) => ((r.pourcentageMoi ?? compteJointConfig.pourcentageDefaut ?? 50)) / 100;
            const net = (r) => ((r.recettes || 0) - (r.depenses || 0)) * pMoi(r);

            const p1Base = si * pctSI - sdc * pctSI;
            totalInstantT  += p1Base + rows.filter(r => r.dateDepensesRecettes != null).reduce((a, r) => a + net(r), 0) + virNetForCompte(nom, true);
            totalTheorique += p1Base + rows.reduce((a, r) => a + net(r), 0)                                             + virNetForCompte(nom, false);

            rows
                .filter(r => !r.depenseRecettesAMasquer && r.dateDepensesRecettes && new Date(r.dateDepensesRecettes) >= twelveMonthsAgo)
                .forEach(r => {
                    const p = pMoi(r);
                    totalDepenses12m += (r.depenses || 0) * p;
                    totalRecettes12m += (r.recettes || 0) * p;
                });
        }

        const ratio = totalRecettes12m > 0 ? (totalDepenses12m / totalRecettes12m * 100) : null;
        const reste = totalRecettes12m - totalDepenses12m;

        return { totalInstantT, totalTheorique, totalDepenses12m, totalRecettes12m, ratio, reste };
    }, [comptesData, rowsByCompte, virementInternesRows, compteJointData, compteJointConfig]);

    const { totalInstantT, totalTheorique, totalDepenses12m, totalRecettes12m, ratio, reste } = stats;

    return (
        <Box sx={recapCardSx}>
            <Box sx={recapHeaderSx}>
                <PersonIcon sx={recapIconSx} />
                <Typography sx={recapTitleSx}>Récapitulatif personnel</Typography>
            </Box>
            <Box sx={recapSectionsSx}>

                <Box sx={recapSectionSx}>
                    <Typography sx={recapSectionLabelSx}>Instant T</Typography>
                    <Typography sx={recapBigValueSx}>{formatEuro(totalInstantT)}</Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={recapVerticalDividerSx} />

                <Box sx={recapSectionSx}>
                    <Typography sx={recapSectionLabelSx}>Solde théorique</Typography>
                    <Typography sx={recapBigValueSx}>{formatEuro(totalTheorique)}</Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={recapVerticalDividerSx} />

                <Box sx={recapSectionSx}>
                    <Typography sx={recapSectionLabelSx}>12 mois glissants</Typography>
                    <Box sx={recapSubItemsRowSx}>
                        <Box sx={recapSubItemSx}>
                            <Typography sx={recapSubLabelSx}>Dépenses</Typography>
                            <Typography sx={recapSubValueSx}>{formatEuro(totalDepenses12m)}</Typography>
                        </Box>
                        <Box sx={recapSubItemSx}>
                            <Typography sx={recapSubLabelSx}>Recettes</Typography>
                            <Typography sx={recapSubValueSx}>{formatEuro(totalRecettes12m)}</Typography>
                        </Box>
                        <Box sx={recapSubItemSx}>
                            <Typography sx={recapSubLabelSx}>Ratio dép./rec.</Typography>
                            <Typography sx={recapSubValueSx}>{ratio != null ? `${ratio.toFixed(1)} %` : '—'}</Typography>
                        </Box>
                        <Box sx={recapSubItemSx}>
                            <Typography sx={recapSubLabelSx}>Reste à dépenser</Typography>
                            <Typography sx={reste >= 0 ? recapSubValuePositiveSx : recapSubValueNegativeSx}>{formatEuro(reste)}</Typography>
                        </Box>
                    </Box>
                </Box>

            </Box>
        </Box>
    );
}

export default StatCardRecap;
