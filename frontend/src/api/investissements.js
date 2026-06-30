import { formatDate, get, post } from './client.js';

const fromApi = (doc) => ({
    id: doc.id,
    nom: doc.nom ?? '',
    type: doc.type ?? '',
    courtier: doc.courtier ?? '',
    montantInvesti: doc.montantInvesti ?? 0,
    tauxFrais: doc.tauxFrais ?? 0,
    dateOuverture: doc.dateOuverture ? new Date(doc.dateOuverture) : null,
    sommeInitiale: doc.sommeInitiale ?? 0,
    datePremierVersement: doc.datePremierVersement ? new Date(doc.datePremierVersement) : null,
    fraisFixeRef: doc.fraisFixeRef || null,
    historique: (doc.historique ?? []).map(h => ({
        id: h.id,
        date: h.date ? new Date(h.date) : null,
        valeur: h.valeur ?? 0,
    })),
});

const toApi = (row) => ({
    id: row.id,
    nom: row.nom,
    type: row.type,
    courtier: row.courtier || '',
    montantInvesti: parseFloat(row.montantInvesti) || 0,
    tauxFrais: parseFloat(row.tauxFrais) || 0,
    dateOuverture: formatDate(row.dateOuverture),
    sommeInitiale: parseFloat(row.sommeInitiale) || 0,
    datePremierVersement: formatDate(row.datePremierVersement),
});

export const fetchInvestissements = async () => {
    const data = await get('/liste-investissements');
    return data.map(fromApi);
};

export const saveInvestissement = async (row, isNew) => {
    const path = isNew ? '/ajout-investissement' : '/modification-investissement';
    const json = await post(path, toApi(row));
    return fromApi(json);
};

export const deleteInvestissement = async (row) => {
    await post('/suppression-investissement', { id: row.id });
};

export const lierFraisFixe = async (investissementId, fraisFixeId) => {
    const json = await post('/lier-investissement-frais-fixe', { id: investissementId, fraisFixeRef: fraisFixeId || null });
    return fromApi(json);
};
