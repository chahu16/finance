import { formatDate, get, post } from './client.js';

// Mapping Backend → Frontend
// rembourser     → notesFraisRemboursee
// parts[0]       → pourcentageMoi
const fromApi = (doc) => ({
    id: doc.id,
    compte: doc.compte,
    dateDepensesRecettes: doc.dateDepensesRecettes ? new Date(doc.dateDepensesRecettes) : null,
    description: doc.description,
    depenses: doc.depenses ?? 0,
    recettes: doc.recettes ?? 0,
    noteDeFrais: !!doc.noteDeFrais,
    notesFraisRemboursee: !!(doc.rembourser ?? doc.notesFraisRemboursee),
    fraisFixe: !!doc.fraisFixe,
    chequeEnCours: !!doc.chequeEnCours,
    depenseRecettesAMasquer: !!doc.depenseRecettesAMasquer,
    pourcentageMoi: Array.isArray(doc.parts) && doc.parts.length > 0 ? doc.parts[0] : 50,
    fraisFixePeriode: doc.fraisFixePeriode ?? null,
    fraisFixeRef: doc.fraisFixeRef ?? null,
    categorie: doc.categorie || '',
    sousCategorie: doc.sousCategorie || '',
    investissementRef: doc.investissementRef ?? null,
    montantBrutRetrait: doc.montantBrutRetrait ?? null,
    depenseReelle: doc.depenseReelle ?? null,
    depassementPlafond: doc.depassementPlafond ?? null,
});

// Mapping Frontend → Backend
const toApi = (row) => ({
    id: row.id,
    compte: row.compte,
    dateDepensesRecettes: formatDate(row.dateDepensesRecettes),
    description: row.description,
    depenses: row.depenses ?? 0,
    recettes: row.recettes ?? 0,
    notesFraisRemboursee: !!row.notesFraisRemboursee,
    fraisFixe: !!row.fraisFixe,
    chequeEnCours: !!row.chequeEnCours,
    depenseRecettesAMasquer: !!row.depenseRecettesAMasquer,
    fraisFixePeriode: row.fraisFixePeriode ?? null,
    fraisFixeRef: row.fraisFixeRef ?? null,
    parts: [
        row.pourcentageMoi ?? 50,
        row.pourcentageMoi != null ? 100 - row.pourcentageMoi : 50,
    ],
    sousCategorie: row.sousCategorie || null,
    investissementRef: row.investissementRef || null,
    montantBrutRetrait: row.montantBrutRetrait ?? null,
});

// Les deux endpoints (comptes normaux + compte joint) sont chargés en parallèle
// et fusionnés dans le même état rows.
export const fetchDepensesRecettes = async () => {
    const [normal, joint] = await Promise.all([
        get('/liste-depenses-recettes'),
        get('/liste-compte-joint'),
    ]);
    return [...normal, ...joint].map(fromApi);
};

// Les lignes auto-injectées (fraisFixe sans date) ont un id client (randomId),
// pas un ObjectId Mongo — on les traite comme de nouvelles entrées.
const isMongoId = (id) => /^[0-9a-f]{24}$/i.test(String(id ?? ''));

export const saveDepenseRecette = async (row, isNew) => {
    const shouldCreate = isNew || !isMongoId(row.id);
    const path = shouldCreate ? '/ajout-depense-recette' : '/modification-depense-recette';
    const json = await post(path, toApi(row));
    return fromApi(json);
};

export const deleteDepenseRecette = async (row) => {
    if (!isMongoId(row.id)) return; // ligne jamais persistée en base — suppression locale uniquement
    await post('/suppression-depense-recette', { id: row.id });
};

export const rembourserNotesFrais = async (sousCategorieId) => {
    const json = await post('/rembourser-notes-frais', { sousCategorieId });
    return {
        updated: json.updated.map(fromApi),
        discordance: json.discordance ?? null,
        totalRecu: json.totalRecu ?? null,
    };
};
