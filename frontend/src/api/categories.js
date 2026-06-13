import { API_BASE, post } from './client.js';

export const fetchCategories = async () => {
    const res = await fetch(`${API_BASE}/liste-categories`);
    if (!res.ok) throw new Error('Erreur chargement catégories');
    return await res.json();
};

export const saveCategorie = async (row, isNew) => {
    const path = isNew ? '/ajout-categorie' : '/modification-categorie';
    return post(path, { id: row.id, groupe: row.groupe, nom: row.nom, type: row.type, bucket: row.bucket ?? null });
};

export const deleteCategorie = async (row) => {
    await post('/suppression-categorie', { id: row.id });
};
