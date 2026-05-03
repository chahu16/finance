import { useState, useEffect } from "react";
import axios from "axios";
import { formatDepensesRecettesBackToFront } from "../gridConfigs/DepensesRecettesGrid.js";
import { formatComptesBackToFront } from "../gridConfigs/ComptesGrid.js";
import { formatVirementBackToFront } from "../gridConfigs/VirementInterneGrid.js";
import { formatFraisFixeBackToFront } from "../gridConfigs/FraisfixeGrid.js";

// Configuration de l'adresse du serveur
const baseURL = process.env.REACT_APP_API_URL

// ============================================================
// HOOKS PERSONNALISÉS (LECTURE)
// ============================================================

// Récupère la liste complète des dépenses et recettes
export function useListeBDDDepensesRecettes(refreshKey = 0) {
    const [depensesRecettes, setdepensesRecettes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`${baseURL}/liste-depenses-recettes`)
            .then(res => {
                setdepensesRecettes(res.data.map(e => formatDepensesRecettesBackToFront(e)));
                setLoading(false);
            })
            .catch(err => {
                setError(err);
                setLoading(false);
            });
    }, [refreshKey]);

    return { depensesRecettes, setdepensesRecettes, loading, error };
}

// Récupère la liste des noms de comptes disponibles pour les menus déroulants
export function useListeNomsComptes(refreshKey = 0) {
    const [nomsComptes, setNomsComptes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${baseURL}/tableau-liste-noms-comptes`)
            .then(res => {
                setNomsComptes(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur chargement comptes", err);
                setLoading(false);
            });
    }, [refreshKey]);

    return { nomsComptes, loading };
}
// Récupère la liste des noms de comptes disponibles pour les frais fixes
export function useListeNomsComptesFraisFixe(refreshKey = 0) {
    const [nomsComptes, setNomsComptes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${baseURL}/tableau-liste-noms-comptes?avecCompteJoint=true`)
            .then(res => {
                setNomsComptes(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur chargement comptes frais fixes", err);
                setLoading(false);
            });
    }, [refreshKey]);

    return { nomsComptes, loading };
}

// Récupère la liste des comptes disponibles pour le paramétrage
export function useListeComptes(refreshKey = 0) {
    const [comptes, setComptes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${baseURL}/tableau-liste-comptes`)
            .then(res => {
                setComptes(res.data.map(e => formatComptesBackToFront(e)));
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur chargement comptes", err);
                setLoading(false);
            });
    }, [refreshKey]);

    return { comptes, loading };
}
// Récupère la liste des plafonds notes de frais
export function useListePlafonds(refreshKey = 0) {
    const [plafonds, setPlafonds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${baseURL}/liste-plafonds-notes-frais`)
            .then(res => {
                setPlafonds(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur chargement plafonds", err);
                setLoading(false);
            });
    }, [refreshKey]);

    return { plafonds, loading };
}
// Ajout d'un plafond
export async function AjoutPlafond(plafondAAjouter) {
    try {
        const response = await axios.post(`${baseURL}/ajout-plafond-notes-frais`, plafondAAjouter);
        return response.data;
    } catch (err) {
        console.error("Erreur API Ajout plafond:", err);
        throw err;
    }
}

// ============================================================
// DEPENSES RECETTES
// ============================================================

// Création d'une nouvelle entrée
export async function CreationDepenseRecette(DepenseRecetteAAjouter) {
    try {
        const response = await axios.post(`${baseURL}/ajout-depense-recette`, DepenseRecetteAAjouter);
        return formatDepensesRecettesBackToFront(response.data);
    } catch (err) {
        console.error("Erreur API Ajout:", err);
        throw err;
    }
}

// Suppression d'une entrée
export async function SuppressionDepenseRecette(DepenseRecetteASupprimer) {
    try {
        const response = await axios.post(`${baseURL}/suppression-depense-recette`, DepenseRecetteASupprimer);
        return response.data;
    } catch (err) {
        console.error("Erreur API Suppression:", err);
        throw err;
    }
}

// Modification d'une entrée existante
export async function ModificationDepenseRecette(DepenseRecetteAModifier) {
    try {
        const response = await axios.post(`${baseURL}/modification-depense-recette`, DepenseRecetteAModifier);
        return formatDepensesRecettesBackToFront(response.data);
    } catch (err) {
        console.error("Erreur API Modification :", err);
        throw err;
    }
}

// Création groupée (Bulk) de plusieurs entrées
export async function CreationDepenseRecetteBulk(tableauAAjouter) {
    try {
        // On envoie le tableau complet
        const response = await axios.post(`${baseURL}/ajout-depense-recette-bulk`, tableauAAjouter);

        // On formate chaque élément reçu du serveur (qui aura son nouvel ID MongoDB)
        return response.data.map(item => formatDepensesRecettesBackToFront(item));
    } catch (err) {
        console.error("Erreur API Bulk Ajout:", err);
        throw err;
    }
}

// ============================================================
// VIREMENTS INTERNES
// ============================================================

// Récupère la liste complète des virements internes
export function useListeVirements(refreshKey = 0) {
    const [virements, setVirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`${baseURL}/liste-virements-internes`)
            .then(res => {
                setVirements(res.data.map(e => formatVirementBackToFront(e)));
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur chargement virements", err);
                setError(err);
                setLoading(false);
            });
    }, [refreshKey]);

    return { virements, loading, error };
}

// Création d'un virement interne
export async function CreationVirement(virementAAjouter) {
    try {
        const response = await axios.post(`${baseURL}/ajout-virement-interne`, virementAAjouter);
        return formatVirementBackToFront(response.data);
    } catch (err) {
        console.error("Erreur API Ajout virement:", err);
        throw err;
    }
}

// Création bulk de virements (import CSV)
export async function CreationVirementsBulk(virementsAAjouter) {
    try {
        const response = await axios.post(`${baseURL}/ajout-virement-interne-bulk`, virementsAAjouter);
        return response.data.map(formatVirementBackToFront);
    } catch (err) {
        console.error("Erreur API Bulk virements:", err);
        throw err;
    }
}

// Modification d'un virement interne
export async function ModificationVirement(virementAModifier) {
    try {
        const response = await axios.post(`${baseURL}/modification-virement-interne`, virementAModifier);
        return formatVirementBackToFront(response.data);
    } catch (err) {
        console.error("Erreur API Modification virement:", err);
        throw err;
    }
}

// Suppression d'un virement interne
export async function SuppressionVirement(virementASupprimer) {
    try {
        const response = await axios.post(`${baseURL}/suppression-virement-interne`, virementASupprimer);
        return response.data;
    } catch (err) {
        console.error("Erreur API Suppression virement:", err);
        throw err;
    }
}

// ============================================================
// FRAIS FIXES
// ============================================================

// Récupère la liste complète des frais fixes
export function useListeFraisFixes(refreshKey = 0) {
    const [fraisFixes, setFraisFixes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`${baseURL}/liste-frais-fixe`)
            .then(res => {
                setFraisFixes(res.data.map(e => formatFraisFixeBackToFront(e)));
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur chargement frais fixes", err);
                setError(err);
                setLoading(false);
            });
    }, [refreshKey]);

    return { fraisFixes, loading, error };
}

// Création d'un frais fixe
export async function CreationFraisFixe(fraisFixeAAjouter) {
    try {
        const response = await axios.post(`${baseURL}/ajout-frais-fixe`, fraisFixeAAjouter);
        return formatFraisFixeBackToFront(response.data);
    } catch (err) {
        console.error("Erreur API Ajout frais fixe:", err);
        throw err;
    }
}

// Création bulk de frais fixes (import CSV)
export async function CreationFraisFixeBulk(fraisFixesAAjouter) {
    try {
        const response = await axios.post(`${baseURL}/ajout-frais-fixe-bulk`, fraisFixesAAjouter);
        return response.data.map(formatFraisFixeBackToFront);
    } catch (err) {
        console.error("Erreur API Bulk frais fixes:", err);
        throw err;
    }
}

// Modification d'un frais fixe
export async function ModificationFraisFixe(fraisFixeAModifier) {
    try {
        const response = await axios.post(`${baseURL}/modification-frais-fixe`, fraisFixeAModifier);
        return formatFraisFixeBackToFront(response.data);
    } catch (err) {
        console.error("Erreur API Modification frais fixe:", err);
        throw err;
    }
}

// Suppression d'un frais fixe
export async function SuppressionFraisFixe(fraisFixeASupprimer) {
    try {
        const response = await axios.post(`${baseURL}/suppression-frais-fixe`, fraisFixeASupprimer);
        return response.data;
    } catch (err) {
        console.error("Erreur API Suppression frais fixe:", err);
        throw err;
    }
}

// Archiver / désarchiver un frais fixe
export async function ArchiverFraisFixe(fraisFixeAArchiver) {
    try {
        const response = await axios.post(`${baseURL}/archiver-frais-fixe`, fraisFixeAArchiver);
        return formatFraisFixeBackToFront(response.data);
    } catch (err) {
        console.error("Erreur API Archiver frais fixe:", err);
        throw err;
    }
}

// ============================================================
// COMPTES - PERSO
// ============================================================

// Création d'un compte
export async function CreationCompte(compteAAjouter) {
    try {
        const response = await axios.post(`${baseURL}/ajout-compte`, compteAAjouter);
        return formatComptesBackToFront(response.data);
    } catch (err) {
        console.error("Erreur API Ajout compte:", err);
        throw err;
    }
}

// Création bulk de comptes (import CSV)
export async function CreationComptesBulk(comptesAAjouter) {
    try {
        const response = await axios.post(`${baseURL}/ajout-compte-bulk`, comptesAAjouter);
        return response.data.map(e => formatComptesBackToFront(e));
    } catch (err) {
        console.error("Erreur API Bulk comptes:", err);
        throw err;
    }
}

// Archiver / désarchiver un compte
export async function ArchiverCompte({ id, archive }) {
    try {
        const response = await axios.post(`${baseURL}/archiver-compte`, { id, archive });
        return response.data;
    } catch (err) {
        console.error("Erreur API Archiver compte:", err);
        throw err;
    }
}

// Modification d'un compte
export async function ModificationCompte(compteAModifier) {
    try {
        const response = await axios.post(`${baseURL}/modification-compte`, compteAModifier);
        return formatComptesBackToFront(response.data);
    } catch (err) {
        console.error("Erreur API Modification compte:", err);
        throw err;
    }
}

// Suppression d'un compte (retourne { action: 'archive'|'suppression', compte? })
export async function SuppressionCompte(compteASupprimer) {
    try {
        const response = await axios.post(`${baseURL}/suppression-compte`, compteASupprimer);
        return response.data;
    } catch (err) {
        console.error("Erreur API Suppression compte:", err);
        throw err;
    }
}

// Vérifie si un compte a des lignes liées (avant suppression)
export async function CheckCompte(id) {
    try {
        const response = await axios.get(`${baseURL}/check-compte/${id}`);
        return response.data; // { lignesLiees: true/false }
    } catch (err) {
        console.error("Erreur API Check compte:", err);
        throw err;
    }
}

// ============================================================
// COMPTES - PERSO
// ============================================================

export function useListeCompteJoint(refreshKey = 0) {
    const [lignes, setLignes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`${baseURL}/liste-compte-joint`)
            .then(res => {
                setLignes(res.data.map(formatDepensesRecettesBackToFront));
                setLoading(false);
            })
            .catch(err => {
                setError(err);
                setLoading(false);
            });
    }, [refreshKey]);

    return { lignes, loading, error };
}