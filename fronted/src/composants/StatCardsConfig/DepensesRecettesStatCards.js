/**
 * ============================================================
 * LOGIQUE DE CALCUL DES STATISTIQUES
 * ============================================================
 * Ce fichier traite les lignes brutes du DataGrid pour générer
 * les chiffres affichés dans les StatCards.
 */

export const getStatCardsData = (rows, virements = [], comptes = []) => {
    // Initialisation des variables de temps pour le filtre mensuel
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Initialisation de tous les comptes actifs
    const resultatsParCompte = comptes.reduce((acc, compteData) => {
        acc[compteData.nom] = {
            moisEnCoursDepenses: 0,
            soldeTotal: compteData.soldeInitial - compteData.sommeDeCote,
            soldeInstantT: compteData.soldeInitial - compteData.sommeDeCote,
            seuil: compteData.seuil ?? 0,
            seuilOrange: compteData.seuilOrange ?? 0,
        };
        return acc;
    }, {});

    rows
        // On ignore les lignes sans compte assigné
        .filter(row => row.compte && row.compte.trim() !== "")

        // Accumulation des données par compte
        .reduce((acc, row) => {
            const compte = row.compte;

            // --- PRÉPARATION DES DONNÉES NUMÉRIQUES ---
            // Sécurisation : conversion en nombre et gestion des valeurs vides (0)
            const depense = parseFloat(row.depenses) || 0;
            const recette = parseFloat(row.recettes) || 0;
            const impactFinancier = recette - depense;

            // --- GESTION DES DATES ET ÉTATS ---
            const dateValue = row.dateDepensesRecettes;
            const dateRow = dateValue ? new Date(dateValue) : null;

            const isCheque = row.chequeEnCours === true;
            const isMasque = row.depenseRecettesAMasquer === true;
            const isNotesFrais = row.noteDeFrais === true;
            const isFraisFixeSansDate = row.fraisFixe === true && !row.dateDepensesRecettes;

            // --- INITIALISATION DU COMPTE ---
            // Si le compte n'existe pas encore dans l'accumulateur, on le crée
            if (!acc[compte]) {
                const compteData = comptes.find(c => c.nom === compte);
                const soldeInitial = compteData?.soldeInitial ?? 0;
                const sommeDeCote = compteData?.sommeDeCote ?? 0;
                acc[compte] = {
                    moisEnCoursDepenses: 0,
                    soldeTotal: soldeInitial - sommeDeCote,
                    soldeInstantT: soldeInitial - sommeDeCote,
                    seuil: compteData?.seuil ?? 0,
                    seuilOrange: compteData?.seuilOrange ?? 0,
                };
            }

            // --- 1. CALCUL DES DÉPENSES DU MOIS ---
            // On vérifie si la ligne appartient au mois et à l'année en cours
            // Condition supplémentaire : on ignore les lignes marquées "À masquer" et "notes de frais"
            if (dateRow && !isNaN(dateRow.getTime())) {
                if (dateRow.getMonth() === currentMonth && dateRow.getFullYear() === currentYear) {
                    if (!isMasque || !isNotesFrais) {
                        acc[compte].moisEnCoursDepenses += depense;
                    }
                }
            }

            // --- 2. CALCUL DU SOLDE THÉORIQUE ---
            // Reflète la comptabilité totale (Recettes - Dépenses)
            acc[compte].soldeTotal += impactFinancier;

            // --- 3. CALCUL DU SOLDE INSTANT T ---
            // Reflète l'état réel en banque (Exclut les lignes avec "Chèque en cours")
            if (!isCheque && !isFraisFixeSansDate) {
                acc[compte].soldeInstantT += impactFinancier;
            }

            return acc;
        }, resultatsParCompte);

    // --- APPLICATION DES VIREMENTS INTERNES ---
    // Pour chaque virement : on soustrait du compte source, on ajoute au compte destination
    virements.forEach(virement => {
        const montant = parseFloat(virement.montant) || 0;
        const source = virement.compteSource;
        const destination = virement.compteDestination;

        if (source && resultatsParCompte[source]) {
            resultatsParCompte[source].soldeTotal -= montant;
            resultatsParCompte[source].soldeInstantT -= montant;
        }

        if (destination && resultatsParCompte[destination]) {
            resultatsParCompte[destination].soldeTotal += montant;
            resultatsParCompte[destination].soldeInstantT += montant;
        }
    });

    return resultatsParCompte;
};

export const getStatCardsCompteJoint = (rowsCompteJoint = [], compteJoint = null, virements = [], personneProprietaire = 0) => {
    if (!compteJoint) return null;


    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const personnes = compteJoint.personnes?.length >= 2
        ? compteJoint.personnes
        : ["Personne 1", "Personne 2"];

    const stats = personnes.map((nom) => ({
        nom,
        moisEnCoursDepenses: 0,
        soldeTotal: 0,
        soldeInstantT: 0,
    }));

    const global = {
        moisEnCoursDepenses: 0,
        soldeTotal: 0,
        soldeInstantT: 0,
    };

    rowsCompteJoint.forEach(row => {
        const parts = row.parts ?? [50, 50];
        const depense = parseFloat(row.depenses) || 0;
        const recette = parseFloat(row.recettes) || 0;
        const isCheque = row.chequeEnCours === true;
        const isFraisFixeSansDate = row.fraisFixe === true && !row.dateDepensesRecettes;
        const dateRow = row.dateDepensesRecettes ? new Date(row.dateDepensesRecettes) : null;
        const impact = recette - depense;

        // Global
        global.soldeTotal += impact;
        if (!isCheque && !isFraisFixeSansDate) global.soldeInstantT += impact;
        if (dateRow && !isNaN(dateRow.getTime()) &&
            dateRow.getMonth() === currentMonth && dateRow.getFullYear() === currentYear) {
            global.moisEnCoursDepenses += depense;
        }

        // Par personne
        personnes.forEach((nom, index) => {
            const pct = (parts[index] ?? 50) / 100;
            const impactPct = impact * pct;
            stats[index].soldeTotal += impactPct;
            if (!isCheque && !isFraisFixeSansDate) stats[index].soldeInstantT += impactPct;
            if (dateRow && !isNaN(dateRow.getTime()) &&
                dateRow.getMonth() === currentMonth && dateRow.getFullYear() === currentYear) {
                stats[index].moisEnCoursDepenses += depense * pct;
            }
        });
    });

    // Virements vers le compte joint → 100% pour le propriétaire
    virements.forEach(virement => {
        const montant = parseFloat(virement.montant) || 0;
        if (virement.compteDestination === compteJoint?.nom) {
            global.soldeTotal += montant;
            global.soldeInstantT += montant;
            stats[personneProprietaire].soldeTotal += montant;
            stats[personneProprietaire].soldeInstantT += montant;
        }
    });

    return { stats, global };
};

/**
 * ============================================================
 * CONFIGURATION VISUELLE (LOOK & FEEL)
 * ============================================================
 */

/**
 * Définit le style de la carte (bordure) et la couleur du texte 
 * en fonction du solde (Vert si positif, Rouge si négatif).
 */
export const getStatStyles = (solde, seuil = 0, seuilOrange = 0) => {
    let color = "success.main";
    if (seuil > 0) {
        const seuilOrangeMontant = seuil * (1 + seuilOrange / 100);
        if (solde < seuil) color = "error.main";
        else if (solde < seuilOrangeMontant) color = "warning.main";
        else color = "success.main";
    } else {
        color = solde >= 0 ? "success.main" : "error.main";
    }
    return {
        card: {
            borderRadius: 2,
            boxShadow: 2,
            borderTop: '4px solid',
            borderColor: color,
            height: '100%'
        },
        instantTColor: color
    };
};

/**
 * Génère dynamiquement le libellé du mois en cours.
 * Gère l'élision (Mois de / Mois d') selon la première lettre du mois.
 */
export const getMonthPrefixLabel = () => {
    const now = new Date();
    const monthName = now.toLocaleDateString('fr-FR', { month: 'long' });

    // Capitalisation de la première lettre
    const formatted = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // Détermination du préfixe (Mois de / Mois d')
    const prefix = ['A', 'E', 'I', 'O', 'U', 'Y'].includes(formatted[0]) ? "Mois d'" : "Mois de ";

    return `${prefix}${formatted}`;
};