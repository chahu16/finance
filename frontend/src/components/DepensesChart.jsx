import { useEffect, useRef, useMemo } from 'react';
import Box from '@mui/material/Box';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const PAYE_LOYER_KEYWORDS = ['paye', 'loyer'];

function buildMonthKey(date) {
    const d = new Date(date);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
}

function monthLabel(key) {
    const [year, month] = key.split('-');
    return `${month}/${year}`;
}

function getLast13Months() {
    const months = [];
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        months.push(`${d.getFullYear()}-${mm}`);
    }
    return months;
}

function buildChartData(rows, compteJointNom, pourcentageDefaut) {
    const months = getLast13Months();
    const buckets = {};
    months.forEach(m => {
        buckets[m] = { fraisFixes: 0, depenses: 0, notesDeFrais: 0, payeLoyer: 0 };
    });

    for (const row of rows) {
        if (row.depenseRecettesAMasquer) continue;
        if (!row.dateDepensesRecettes) continue;

        const key = buildMonthKey(row.dateDepensesRecettes);
        if (!buckets[key]) continue;

        const isJoint = compteJointNom && row.compte === compteJointNom;
        const pct = isJoint ? ((row.pourcentageMoi ?? pourcentageDefaut) / 100) : 1;

        const dep = (row.depenses ?? 0) * pct;
        const rec = (row.recettes ?? 0) * pct;
        const desc = (row.description ?? '').toLowerCase();

        if (dep > 0) {
            if (row.noteDeFrais) {
                buckets[key].notesDeFrais += dep;
            } else if (row.fraisFixe) {
                buckets[key].fraisFixes += dep;
            } else {
                buckets[key].depenses += dep;
            }
        }

        if (rec > 0 && PAYE_LOYER_KEYWORDS.some(kw => desc.includes(kw))) {
            buckets[key].payeLoyer += rec;
        }
    }

    return {
        labels: months.map(monthLabel),
        series: months.map(m => ({
            fraisFixes:   Math.round(buckets[m].fraisFixes   * 100) / 100,
            depenses:     Math.round(buckets[m].depenses     * 100) / 100,
            notesDeFrais: Math.round(buckets[m].notesDeFrais * 100) / 100,
            payeLoyer:    Math.round(buckets[m].payeLoyer    * 100) / 100,
        })),
    };
}

function DepensesChart({ rows, compteJointNom, pourcentageDefaut = 50 }) {
    const chartRef    = useRef(null);
    const chartInst   = useRef(null);

    const { labels, series } = useMemo(
        () => buildChartData(rows, compteJointNom, pourcentageDefaut),
        [rows, compteJointNom, pourcentageDefaut]
    );

    useEffect(() => {
        if (chartInst.current) {
            chartInst.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        chartInst.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Frais fixes',
                        type: 'bar',
                        data: series.map(m => m.fraisFixes),
                        backgroundColor: '#4CAF50',
                        borderRadius: 3,
                        order: 2,
                        stack: 'depenses',
                    },
                    {
                        label: 'Dépenses',
                        type: 'bar',
                        data: series.map(m => m.depenses),
                        backgroundColor: '#378ADD',
                        borderRadius: 3,
                        order: 2,
                        stack: 'depenses',
                    },
                    {
                        label: 'Notes de frais',
                        type: 'bar',
                        data: series.map(m => m.notesDeFrais),
                        backgroundColor: '#D85A30',
                        borderRadius: 3,
                        order: 2,
                    },
                    {
                        label: 'Paye + Loyer',
                        type: 'line',
                        data: series.map(m => m.payeLoyer),
                        borderColor: '#EF9F27',
                        backgroundColor: 'rgba(239,159,39,0.08)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: '#EF9F27',
                        tension: 0.3,
                        fill: false,
                        order: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 12 },
                            usePointStyle: true,
                            pointStyle: 'rect',
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const mois = series[ctx.dataIndex];
                                const total = (mois.depenses ?? 0) + (mois.fraisFixes ?? 0);
                                const pct = total > 0
                                    ? Math.round(ctx.parsed.y / total * 100)
                                    : 0;
                                const valStr = ctx.parsed.y.toLocaleString('fr-FR', {
                                    style: 'currency',
                                    currency: 'EUR',
                                });
                                return `${ctx.dataset.label} : ${valStr} (${pct}%)`;
                            },
                            footer: (ctxItems) => {
                                const mois = series[ctxItems[0].dataIndex];
                                const total = (mois.depenses ?? 0) + (mois.fraisFixes ?? 0);
                                const totalStr = total.toLocaleString('fr-FR', {
                                    style: 'currency',
                                    currency: 'EUR',
                                });
                                return `Total du mois : ${totalStr}`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { font: { size: 11 } },
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            font: { size: 11 },
                            callback: v => v.toLocaleString('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                maximumFractionDigits: 0,
                            }),
                        },
                    },
                },
            },
        });

        return () => {
            if (chartInst.current) chartInst.current.destroy();
        };
    }, [labels, series]);

    return (
        <Box sx={{ width: '100%', height: 420, position: 'relative' }}>
            <canvas ref={chartRef} />
        </Box>
    );
}

export default DepensesChart;
