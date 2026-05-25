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
        let dueDate = new Date(y, m, effectiveDayThis);
        dueDate.setHours(0, 0, 0, 0);

        // L'échéance du mois courant est-elle déjà passée ?
        // Utilisé pour ne supprimer un placeholder que si l'occurrence est vraiment révolue,
        // et non simplement parce que la fenêtre de 2 jours n'est pas encore ouverte.
        const occurrencePast = dueDate < today;

        if (occurrencePast) {
            // Déjà passé ce mois-ci → mois suivant
            const effectiveDayNext = Math.min(jourPrelevement, daysInMonth(y, m + 1));
            dueDate = new Date(y, m + 1, effectiveDayNext);
        }

        const dueYear = dueDate.getFullYear();
        const dueMonth = dueDate.getMonth();
        // Déclenchement 2 jours avant (JavaScript gère le débordement vers le mois précédent)
        const triggerDate = new Date(dueYear, dueMonth, jourPrelevement - 2);
        triggerDate.setHours(0, 0, 0, 0);

        return {
            inTriggerWindow: today >= triggerDate,
            occurrencePast,
            triggerDate,
            occurrenceLabel: null,
            isDateInCurrentPeriod: (date) => {
                const d = new Date(date);
                return d.getFullYear() === dueYear && d.getMonth() === dueMonth;
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
