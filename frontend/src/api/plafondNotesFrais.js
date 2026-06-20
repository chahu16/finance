import { get, post } from './client.js';

export const fetchPlafonds = async () => {
    return get('/liste-plafonds-notes-frais');
};

export const ajouterPlafond = async (type, montantMax, dateEffet) => {
    return post('/ajout-plafond-notes-frais', { type, montantMax, dateEffet });
};

export const supprimerPlafond = async (type, id) => {
    return post('/suppression-plafond-notes-frais', { type, id });
};
