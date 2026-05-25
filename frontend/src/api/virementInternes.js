const API_BASE = process.env.REACT_APP_API_URL
    || `http://${window.location.hostname}:8000/finances`;

const fromApi = (doc) => ({
    id: doc.id,
    compteSource: doc.compteSource,
    compteDestination: doc.compteDestination,
    montant: doc.montant,
    dateVirement: doc.dateVirement ? new Date(doc.dateVirement) : null,
});

const formatDate = (date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const toApi = (row) => ({
    id: row.id,
    compteSource: row.compteSource,
    compteDestination: row.compteDestination,
    montant: row.montant,
    dateVirement: formatDate(row.dateVirement),
});

const post = async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur serveur');
    return json;
};

export const fetchVirementInternes = async () => {
    const res = await fetch(`${API_BASE}/liste-virements-internes`);
    if (!res.ok) throw new Error('Erreur chargement virements internes');
    return (await res.json()).map(fromApi);
};

export const saveVirementInterne = async (row, isNew) => {
    const path = isNew ? '/ajout-virement-interne' : '/modification-virement-interne';
    const json = await post(path, toApi(row));
    return fromApi(json);
};

export const deleteVirementInterne = async (row) => {
    await post('/suppression-virement-interne', { id: row.id });
};
