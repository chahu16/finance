import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import PersonIcon from '@mui/icons-material/Person';
import { formatEuro, getMonthLabel } from './config/Config.js';
import {
    recapCardSx, recapHeaderSx, recapIconSx, recapTitleSx,
    recapSectionsSx, recapSectionSx, recapSectionLabelSx,
    recapVerticalDividerSx, recapSubItemsRowSx, recapSubItemSx,
    recapSubLabelSx, recapSubValueSx, recapSubValuePositiveSx, recapSubValueNegativeSx,
} from '../styles/StatCardRecapStyles.js';

const PERIODE_MOIS = { mois: 0, '3mois': 3, '6mois': 6, '12mois': 12 };
const PERIODE_LABEL = { mois: 'Mois en cours', '3mois': '3 derniers mois', '6mois': '6 derniers mois', '12mois': '12 derniers mois' };

function periodeDebut(periode) {
    const now = new Date();
    if (periode === 'mois') {
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const nbMois = PERIODE_MOIS[periode] ?? 12;
    const d = new Date(now);
    d.setMonth(d.getMonth() - nbMois);
    d.setHours(0, 0, 0, 0);
    return d;
}

function StatCardRecap({ comptesData, rowsByCompte, virementInternesRows, compteJointData, compteJointConfig, categoriesRows = [], budget503020Config = {}, fraisFixesRows = [] }) {
    const stats = useMemo(() => {
        let totalInstantT = 0;
        let totalTheorique = 0;
        let totalDepenses12m = 0;
        let totalRecettes12m = 0;
        let totalDepensesMois = 0;
        let totalRecettesMois = 0;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthLabel = getMonthLabel(now);

        const twelveMonthsAgo = new Date(now);
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

            for (const r of rows) {
                if (!r.depenseRecettesAMasquer && r.dateDepensesRecettes && new Date(r.dateDepensesRecettes) >= twelveMonthsAgo) {
                    totalDepenses12m += r.depenses || 0;
                    totalRecettes12m += r.recettes || 0;
                }
            }

            for (const r of rows) {
                if (r.depenseRecettesAMasquer || !r.dateDepensesRecettes) continue;
                const d = new Date(r.dateDepensesRecettes);
                if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) continue;
                if (r.noteDeFrais) {
                    const delta = r.depassementPlafond ?? r.depenseReelle ?? 0;
                    totalDepensesMois += delta - ((r.depenses || 0) - delta);
                } else {
                    totalDepensesMois += r.depenses || 0;
                }
                if (r.categorie === 'Revenues') totalRecettesMois += r.recettes || 0;
            }
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

            rows
                .filter(r => {
                    if (r.depenseRecettesAMasquer) return false;
                    if (!r.dateDepensesRecettes) return false;
                    const d = new Date(r.dateDepensesRecettes);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                })
                .forEach(r => {
                    const p = pMoi(r);
                    if (r.noteDeFrais) {
                        const delta = r.depassementPlafond ?? r.depenseReelle ?? 0;
                        totalDepensesMois += (delta - ((r.depenses || 0) - delta)) * p;
                    } else {
                        totalDepensesMois += (r.depenses || 0) * p;
                    }
                    if (r.categorie === 'Revenues') totalRecettesMois += (r.recettes || 0) * p;
                });
        }

        const ratio = totalRecettes12m > 0 ? (totalDepenses12m / totalRecettes12m * 100) : null;
        const reste = totalRecettes12m - totalDepenses12m;

        // ── Règle 50/30/20 ──────────────────────────────────────────────────────
        const bucketMap = Object.fromEntries(categoriesRows.map(c => [c.id, c.bucket]));
        const epargneIds = new Set(categoriesRows.filter(c => c.nom === 'Épargne' && c.type === 'Dépense').map(c => c.id));
        const debut503020 = periodeDebut(budget503020Config.periode ?? '12mois');
        const nbMoisPeriode503020 = { mois: 1, '3mois': 3, '6mois': 6, '12mois': 12 }[budget503020Config.periode ?? '12mois'] ?? 12;

        // IDs des frais fixes non-mensuels → leurs transactions seront remplacées par montantMensuel
        const nonMonthlyFFIds = new Set(
            fraisFixesRows
                .filter(ff => !ff.archived && ff.type === 'Dépense' && ff.periodicite !== 'Mensuel')
                .map(ff => ff.id)
        );

        let revenus503020 = 0;
        let besoins503020 = 0;
        let envies503020 = 0;
        let epargne503020 = 0;

        const seenIds503020 = new Set();

        for (const compte of comptesData) {
            const rows = rowsByCompte[compte.nomCompte] ?? [];
            for (const r of rows) {
                if (r.depenseRecettesAMasquer) continue;
                if (!r.dateDepensesRecettes) continue;
                if (new Date(r.dateDepensesRecettes) < debut503020) continue;
                // Les transactions issues d'un frais fixe non-mensuel sont remplacées par l'amortissement
                if (r.fraisFixeRef && nonMonthlyFFIds.has(r.fraisFixeRef)) continue;
                seenIds503020.add(r.id);
                if (r.categorie === 'Revenues') revenus503020 += r.recettes || 0;
                if (epargneIds.has(r.sousCategorie)) epargne503020 += r.depenses || 0;
                if (!epargneIds.has(r.sousCategorie)) {
                    const bucket = bucketMap[r.sousCategorie];
                    if (bucket === 'besoins') besoins503020 += r.depenses || 0;
                    if (bucket === 'envies') envies503020 += r.depenses || 0;
                }
            }
        }

        // Compte joint — part moi
        if (compteJointData) {
            const nom = compteJointData.nomCompte;
            const rows = rowsByCompte[nom] ?? [];
            for (const r of rows) {
                if (seenIds503020.has(r.id)) continue;
                if (r.depenseRecettesAMasquer) continue;
                if (!r.dateDepensesRecettes) continue;
                if (new Date(r.dateDepensesRecettes) < debut503020) continue;
                if (r.fraisFixeRef && nonMonthlyFFIds.has(r.fraisFixeRef)) continue;
                const pMoi = ((r.pourcentageMoi ?? compteJointConfig.pourcentageDefaut ?? 50)) / 100;
                if (r.categorie === 'Revenues') revenus503020 += (r.recettes || 0) * pMoi;
                if (r.categorie === 'Épargne') epargne503020 += (r.depenses || 0) * pMoi;
                const bucket = bucketMap[r.sousCategorie];
                if (bucket === 'besoins') besoins503020 += (r.depenses || 0) * pMoi;
                if (bucket === 'envies') envies503020 += (r.depenses || 0) * pMoi;
            }
        }

        // Frais fixes non-mensuels — montantMensuel (déjà pro-ratisé + pourcentageMoi) × nb mois période
        for (const ff of fraisFixesRows) {
            if (ff.archived) continue;
            if (ff.type !== 'Dépense') continue;
            if (ff.periodicite === 'Mensuel') continue;
            if (ff.montantMensuel == null) continue;
            besoins503020 += ff.montantMensuel * nbMoisPeriode503020;
        }

        const budget503020 = revenus503020 > 0 ? {
            revenus: revenus503020,
            besoins: { montant: besoins503020, pct: besoins503020 / revenus503020 * 100, cible: 50 },
            envies:  { montant: envies503020,  pct: envies503020  / revenus503020 * 100, cible: 30 },
            epargne: { montant: epargne503020, pct: epargne503020 / revenus503020 * 100, cible: 20 },
        } : null;

        // ── Notes de frais (comptes perso uniquement) ──────────────────────────
        const catFraisProId = categoriesRows.find(c => c.groupe === 'Remboursement' && c.nom === 'Frais pro')?.id ?? null;

        let notesEnCours = 0;
        let deltaPoche12m = 0;
        let totalRemboursRecus12m = 0;
        let totalRemboursableMarque12m = 0;
        let totalRemboursablePending12m = 0;

        for (const compte of comptesData) {
            const rows = rowsByCompte[compte.nomCompte] ?? [];
            for (const r of rows) {
                if (r.noteDeFrais) {
                    if (!r.notesFraisRemboursee) {
                        const depassement = r.depassementPlafond ?? r.depenseReelle ?? 0;
                        notesEnCours += (r.depenses || 0) - depassement;
                    }

                    if (r.dateDepensesRecettes && new Date(r.dateDepensesRecettes) >= twelveMonthsAgo) {
                        const dep = r.depassementPlafond ?? r.depenseReelle ?? null;
                        if (dep != null) deltaPoche12m += dep;
                        if (r.notesFraisRemboursee) {
                            // Exclure les notes sans catégorie plafond reconnue (cohérent backend)
                            if (dep != null) totalRemboursableMarque12m += (r.depenses || 0) - dep;
                        } else {
                            // Pending : fallback full depenses si pas de plafond (= montantRembBoursable backend)
                            totalRemboursablePending12m += dep != null ? (r.depenses || 0) - dep : (r.depenses || 0);
                        }
                    }
                }
                // Remboursements reçus bien catégorisés (12 mois)
                if (catFraisProId && r.sousCategorie === catFraisProId && r.recettes > 0
                    && r.dateDepensesRecettes && new Date(r.dateDepensesRecettes) >= twelveMonthsAgo) {
                    totalRemboursRecus12m += r.recettes;
                }
            }
        }

        // balance = reçus - (remboursable des notes marquées + remboursable des notes en attente)
        // négatif → reste à recevoir ; positif → trop perçu
        const tropMoinsPlein12m = totalRemboursRecus12m - totalRemboursableMarque12m - totalRemboursablePending12m;
        const hasTropMoinsPlein = Math.abs(tropMoinsPlein12m) > 0.005;

        return { totalInstantT, totalTheorique, totalDepenses12m, totalRecettes12m, ratio, reste, budget503020, notesEnCours, deltaPoche12m, tropMoinsPlein12m, hasTropMoinsPlein, totalDepensesMois, totalRecettesMois, monthLabel };
    }, [comptesData, rowsByCompte, virementInternesRows, compteJointData, compteJointConfig, categoriesRows, budget503020Config, fraisFixesRows]);

    const { totalInstantT, totalTheorique, totalDepenses12m, totalRecettes12m, ratio, reste, budget503020, notesEnCours, deltaPoche12m, tropMoinsPlein12m, hasTropMoinsPlein, totalDepensesMois, totalRecettesMois, monthLabel } = stats;

    return (
        <Box sx={recapCardSx}>
            <Box sx={recapHeaderSx}>
                <PersonIcon sx={recapIconSx} />
                <Typography sx={recapTitleSx}>Récapitulatif personnel</Typography>
            </Box>
            <Box sx={recapSectionsSx}>

                <Box sx={recapSectionSx}>
                    <Typography sx={recapSectionLabelSx}>Récapitulatif du mois de {monthLabel} (en cours)</Typography>
                    <Box sx={recapSubItemsRowSx}>
                        <Box sx={recapSubItemSx}>
                            <Typography sx={recapSubLabelSx}>Dépenses</Typography>
                            <Typography sx={recapSubValueSx}>{formatEuro(totalDepensesMois)}</Typography>
                        </Box>
                        <Box sx={recapSubItemSx}>
                            <Typography sx={recapSubLabelSx}>Recettes</Typography>
                            <Typography sx={recapSubValueSx}>{formatEuro(totalRecettesMois)}</Typography>
                        </Box>
                        <Box sx={recapSubItemSx}>
                            <Typography sx={recapSubLabelSx}>Solde théorique</Typography>
                            <Typography sx={recapSubValueSx}>{formatEuro(totalTheorique)}</Typography>
                        </Box>
                        <Box sx={recapSubItemSx}>
                            <Typography sx={recapSubLabelSx}>Instant T</Typography>
                            <Typography sx={recapSubValueSx}>{formatEuro(totalInstantT)}</Typography>
                        </Box>
                    </Box>
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

                <Divider orientation="vertical" flexItem sx={recapVerticalDividerSx} />

                <Box sx={recapSectionSx}>
                    <Typography sx={recapSectionLabelSx}>Notes de frais</Typography>
                    <Box sx={recapSubItemsRowSx}>
                        <Box sx={recapSubItemSx}>
                            <Typography sx={recapSubLabelSx}>En cours</Typography>
                            <Typography sx={recapSubValueSx}>{formatEuro(notesEnCours)}</Typography>
                        </Box>
                        <Box sx={recapSubItemSx}>
                            <Typography sx={recapSubLabelSx}>Delta poche (12m)</Typography>
                            <Typography sx={recapSubValueSx}>{formatEuro(deltaPoche12m)}</Typography>
                        </Box>
                        {hasTropMoinsPlein && (
                            <Box sx={recapSubItemSx}>
                                <Typography sx={recapSubLabelSx}>
                                    {tropMoinsPlein12m < 0 ? 'Reste à rembourser' : 'Trop perçu'}
                                </Typography>
                                <Typography sx={tropMoinsPlein12m < 0 ? recapSubValueSx : recapSubValuePositiveSx}>
                                    {formatEuro(Math.abs(tropMoinsPlein12m))}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                {budget503020 && (
                    <>
                        <Divider orientation="vertical" flexItem sx={recapVerticalDividerSx} />
                        <Box sx={recapSectionSx}>
                            <Typography sx={recapSectionLabelSx}>
                                Règle 50 / 30 / 20
                                {budget503020Config?.periode && (
                                    <Typography component="span" sx={{ ml: 0.75, fontSize: 'inherit' }}>
                                        ({PERIODE_LABEL[budget503020Config.periode] ?? budget503020Config.periode})
                                    </Typography>
                                )}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%', maxWidth: 200 }}>
                                {[
                                    { label: 'Besoins', ...budget503020.besoins },
                                    { label: 'Envies',  ...budget503020.envies },
                                    { label: 'Épargne', ...budget503020.epargne },
                                ].map(({ label, montant, pct, cible }) => {
                                    const ecart = Math.abs(pct - cible);
                                    const color = ecart <= 5 ? '#4caf50' : ecart <= 10 ? '#ff9800' : '#f44336';
                                    return (
                                        <Box key={label}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
                                                <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>{label}</Typography>
                                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color }}>
                                                    {pct.toFixed(1)} % <Typography component="span" sx={{ fontSize: '0.68rem', color: '#aaa', fontWeight: 400 }}>/ {cible} %</Typography>
                                                    <Typography component="span" sx={{ fontSize: '0.68rem', color: '#aaa', fontWeight: 400 }}>{' · '}</Typography><Typography component="span" sx={{ fontSize: '0.68rem', color: '#bbb', fontWeight: 400 }}>{formatEuro(montant)}</Typography>
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(pct, 100)}
                                                sx={{
                                                    height: 5,
                                                    borderRadius: 3,
                                                    backgroundColor: '#f0f0f0',
                                                    '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 3 },
                                                }}
                                            />
                                        </Box>
                                    );
                                })}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5, borderTop: '1px solid #f0f0f0' }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>Revenus</Typography>
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 400, color: '#bbb' }}>{formatEuro(budget503020.revenus)}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </>
                )}

            </Box>
        </Box>
    );
}

export default StatCardRecap;
