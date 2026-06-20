import { get, post } from './client.js';

export const fetchCategories = async () => {
    return get('/liste-categories');
};

export const saveCategorie = async (row, isNew) => {
    const path = isNew ? '/ajout-categorie' : '/modification-categorie';
    return post(path, { id: row.id, groupe: row.groupe, nom: row.nom, type: row.type, bucket: row.bucket ?? null });
};

export const deleteCategorie = async (row) => {
    await post('/suppression-categorie', { id: row.id });
};
