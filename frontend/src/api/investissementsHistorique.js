import { formatDate, post } from './client.js';

const fromApi = (doc) => ({
    id: doc.id,
    investissementId: doc.investissementId ?? '',
    date: doc.date ? new Date(doc.date) : null,
    valeur: doc.valeur ?? 0,
});

const toApi = (row) => ({
    id: row.id,
    investissementId: row.investissementId,
    date: formatDate(row.date),
    valeur: parseFloat(row.valeur) || 0,
});

export const saveInvestissementHistorique = async (row, isNew) => {
    const path = isNew ? '/ajout-investissement-historique' : '/modification-investissement-historique';
    const json = await post(path, toApi(row));
    return fromApi(json);
};

export const deleteInvestissementHistorique = async (row) => {
    await post('/suppression-investissement-historique', { id: row.id });
};
