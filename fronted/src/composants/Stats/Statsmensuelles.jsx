import { useEffect, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Chart, registerables } from "chart.js";
import { useStatsMensuelles } from "../Serveur/DialogueServeurStats";

Chart.register(...registerables);

export default function StatsMensuelles({ personneProprietaire = 0 }) {
    const { data, loading, error } = useStatsMensuelles(personneProprietaire);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext("2d");

        chartInstance.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels: data.map(m => m.label),
                datasets: [
                    {
                        label: "Frais fixes",
                        type: "bar",
                        data: data.map(m => m.fraisFixe),
                        backgroundColor: "#4CAF50",
                        borderRadius: 3,
                        order: 2,
                        stack: 'depenses',
                    },
                    {
                        label: "Dépenses",
                        type: "bar",
                        data: data.map(m => m.depenses),
                        backgroundColor: "#378ADD",
                        borderRadius: 3,
                        order: 2,
                        stack: 'depenses',
                    },
                    {
                        label: "Notes de frais",
                        type: "bar",
                        data: data.map(m => m.notesFrais),
                        backgroundColor: "#D85A30",
                        borderRadius: 3,
                        order: 2,
                    },
                    {
                        label: "Paye + Loyer",
                        type: "line",
                        data: data.map(m => m.payeLoyer),
                        borderColor: "#EF9F27",
                        backgroundColor: "rgba(239,159,39,0.08)",
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: "#EF9F27",
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
                        position: "top",
                        labels: {
                            font: { size: 12 },
                            usePointStyle: true,
                            pointStyle: "rect",
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const moisIndex = ctx.dataIndex;
                                const mois = data[moisIndex];
                                const total = (mois.depenses ?? 0) + (mois.fraisFixe ?? 0);
                                const pct = total > 0 ? Math.round(ctx.parsed.y / total * 100) : 0;
                                return `${ctx.dataset.label} : ${ctx.parsed.y.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} (${pct}%)`;
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
                            callback: v => v.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
                        },
                    },
                },
            },
        });

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [data]);

    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>;
    if (error) return <Typography color="error">Erreur chargement des stats</Typography>;

    return (
        <Box sx={{ width: "100%", height: "400px", position: "relative" }}>
            <canvas ref={chartRef} />
        </Box>
    );
}