import { API_BASE, post } from './client.js';

export const fetchPlafonds = async () => {
    const res = await fetch(`${API_BASE}/liste-plafonds-notes-frais`);
    if (!res.ok) throw new Error('Erreur chargement plafonds');
    return res.json(); // { repas: [...], hotelPDJ: [...], soireeEtape: [...] }
};

export const ajouterPlafond = async (type, montantMax, dateEffet) => {
    return post('/ajout-plafond-notes-frais', { type, montantMax, dateEffet });
};

export const supprimerPlafond = async (type, id) => {
    return post('/suppression-plafond-notes-frais', { type, id });
};
