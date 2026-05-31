/**
 * Calcule si un frais fixe est en fenêtre de déclenchement et fournit
 * un prédicat pour vérifier si une date tombe dans la période courante.
 *
 * Mensuel    : déclenchement 2 jours avant le jour de prélèvement
 * Autres     : déclenchement le mois calendaire précédant chaque occurrence.
 *              Pour Trimestriel (4×/an, toutes les 3 mois) et Semestriel
 *              (2×/an, toutes les 6 mois), le résultat inclut une étiquette
 *              d'occurrence (ex. « 2/4 » pour la 2ème sur 4 dans l'année).
 *
 * Pour Trimestriel / Semestriel / Annuel, jourPrelevement = mois de référence
 * (1-12). Exemples :
 *   Trimestriel jourPrelevement=3 (mars) → occurrences mars, juin, sept., déc. ;
 *              déclenchements en fév. (1/4), mai (2/4), août (3/4), nov. (4/4).
 *   Semestriel  jourPrelevement=6 (juin) → occurrences juin, décembre ;
 *              déclenchements en mai (1/2), nov. (2/2).
 */

const INTERVAL_MONTHS = { Trimestriel: 3, Semestriel: 6, Annuel: 12 };

function daysInMonth(year, month0) {
    return new Date(year, month0 + 1, 0).getDate();
}

export function computeFraisFixeTrigger(ff, today) {
    const { periodicite, jourPrelevement } = ff;
    if (!periodicite || !jourPrelevement) return null;

    if (periodicite === 'Mensuel') {
        const y = today.getFullYear();
        const m = today.getMonth();

        // Clamp le jour au nombre de jours réels du mois cible
        const effectiveDayThis = Math.min(jourPrelevement, daysInMonth(y, m));
        const dueDateThis = new Date(y, m, effectiveDayThis);
        dueDateThis.setHours(0, 0, 0, 0);

        const occurrencePast = dueDateThis < today;

        // Déclenchement 2 jours avant l'échéance du mois courant
        const triggerDateThis = new Date(y, m, jourPrelevement - 2);
        triggerDateThis.setHours(0, 0, 0, 0);

        // Clé de période : année + mois 0-indexé de l'occurrence courante
        const triggerPeriode = `${y}-${m}`;

        if (occurrencePast) {
            // L'échéance est passée : on reste en fenêtre jusqu'à l'ouverture du
            // prochain déclenchement (J-2 du mois suivant), sans limite de durée.
            // La déduplication par triggerPeriode empêche les doublons ; la ligne
            // persiste jusqu'à saisie d'une date par l'utilisateur.
            const nextTriggerDate = new Date(y, m + 1, jourPrelevement - 2);
            nextTriggerDate.setHours(0, 0, 0, 0);

            // Quand jourPrelevement <= 2, J-2 du mois suivant tombe dans le mois
            // courant (ou avant). Si today >= nextTriggerDate on est déjà dans la
            // fenêtre du mois suivant : on bascule sur cette occurrence.
            if (today >= nextTriggerDate) {
                const nextMonthAbs = y * 12 + m + 1;
                const ny = Math.floor(nextMonthAbs / 12);
                const nm = nextMonthAbs % 12;
                return {
                    inTriggerWindow: true,
                    occurrencePast: false,
                    triggerDate: nextTriggerDate,
                    triggerPeriode: `${ny}-${nm}`,
                    occurrenceLabel: null,
                    isDateInCurrentPeriod: (date) => {
                        const d = new Date(date);
                        return d.getFullYear() === ny && d.getMonth() === nm;
                    },
                };
            }

            const inTriggerWindow = today >= triggerDateThis && today < nextTriggerDate;

            return {
                inTriggerWindow,
                occurrencePast: !inTriggerWindow,
                triggerDate: triggerDateThis,
                triggerPeriode,
                occurrenceLabel: null,
                isDateInCurrentPeriod: (date) => {
                    const d = new Date(date);
                    return d.getFullYear() === y && d.getMonth() === m;
                },
            };
        }

        return {
            inTriggerWindow: today >= triggerDateThis,
            occurrencePast: false,
            triggerDate: triggerDateThis,
            triggerPeriode,
            occurrenceLabel: null,
            isDateInCurrentPeriod: (date) => {
                const d = new Date(date);
                return d.getFullYear() === y && d.getMonth() === m;
            },
        };
    }

    const intervalMonths = INTERVAL_MONTHS[periodicite];
    if (!intervalMonths) return null;

    const refMonth0 = jourPrelevement - 1; // 0-indexé
    const todayAbs = today.getFullYear() * 12 + today.getMonth();
    const totalOccurrences = 12 / intervalMonths; // 3 pour Trimestriel, 2 pour Semestriel, 1 pour Annuel

    // Cherche la prochaine occurrence (mois inclus) à partir du mois courant
    // Une occurrence existe quand (abs - refMonth0) % intervalMonths === 0
    for (let delta = 0; delta <= intervalMonths + 1; delta++) {
        const abs = todayAbs + delta;
        if (((abs - refMonth0) % intervalMonths + intervalMonths) % intervalMonths === 0) {
            const dueYear = Math.floor(abs / 12);
            const dueMonth = abs % 12;
            // Déclenchement = mois calendaire précédant le mois d'échéance
            const triggerAbs = abs - 1;
            const triggerYear = Math.floor(triggerAbs / 12);
            const triggerMonth = triggerAbs % 12;

            const inTriggerWindow =
                today.getFullYear() === triggerYear && today.getMonth() === triggerMonth;

            const triggerDate = new Date(triggerYear, triggerMonth, 1);
            triggerDate.setHours(0, 0, 0, 0);

            // Étiquette d'occurrence (ex. "2/3") pour Trimestriel et Semestriel uniquement
            const occurrenceIndex = ((dueMonth - refMonth0 + 12) % 12) / intervalMonths;
            const occurrenceLabel = totalOccurrences > 1
                ? `${occurrenceIndex + 1}/${totalOccurrences}`
                : null;

            return {
                inTriggerWindow,
                occurrencePast: !inTriggerWindow,
                triggerDate,
                triggerPeriode: `${dueYear}-${dueMonth}`,
                occurrenceLabel,
                isDateInCurrentPeriod: (date) => {
                    const d = new Date(date);
                    return d.getFullYear() === dueYear && d.getMonth() === dueMonth;
                },
            };
        }
    }

    return null;
}
