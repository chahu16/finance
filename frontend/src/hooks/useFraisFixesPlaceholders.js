import { useEffect } from 'react';
import { randomId } from '@mui/x-data-grid-generator';
import { computeFraisFixeTrigger } from '../components/utils/FraisFixesTrigger.js';

export function useFraisFixesPlaceholders(fraisFixesRows, setRows, todayKey) {
    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        setRows(prevRows => {
            const toAdd = [];
            const toFix = new Map();  // id → ligne corrigée (placeholder null-période recyclé)
            const toRemoveIds = new Set(); // ids des artefacts null-période à supprimer

            for (const ff of fraisFixesRows) {
                if (ff.archived) continue;

                const trigger = computeFraisFixeTrigger(ff, today);

                const description = ff.description +
                    (trigger?.occurrenceLabel ? ` (${trigger.occurrenceLabel})` : '');

                // Détection d'un placeholder sauvegardé sans période (fraisFixePeriode == null)
                const nullPeriodPlaceholder = prevRows.find(r =>
                    r.compte === ff.compte &&
                    r.fraisFixeRef === ff.id &&
                    r.fraisFixe === true &&
                    r.dateDepensesRecettes == null &&
                    r.fraisFixePeriode == null
                );

                if (nullPeriodPlaceholder) {
                    // Un placeholder avec la bonne période existe-t-il déjà ?
                    const correctPeriodExists = trigger?.inTriggerWindow && prevRows.some(r =>
                        r.compte === ff.compte &&
                        r.fraisFixeRef === ff.id &&
                        r.fraisFixe === true &&
                        r.dateDepensesRecettes == null &&
                        r.fraisFixePeriode === trigger.triggerPeriode
                    );

                    if (!trigger?.inTriggerWindow || correctPeriodExists) {
                        // Hors fenêtre ou doublon avec un bon placeholder : supprimer l'artefact
                        toRemoveIds.add(nullPeriodPlaceholder.id);
                    } else {
                        // En fenêtre et pas de bon placeholder : recycler avec les données correctes
                        toFix.set(nullPeriodPlaceholder.id, {
                            ...nullPeriodPlaceholder,
                            description,
                            depenses: ff.type === 'Dépense' ? ff.montant : 0,
                            recettes: ff.type === 'Recette' ? ff.montant : 0,
                            fraisFixePeriode: trigger.triggerPeriode,
                        });
                    }
                    continue;
                }

                if (!trigger?.inTriggerWindow) continue;

                // Déjà traité si :
                //   a) un placeholder null-date de la MÊME période existe déjà
                //   b) un paiement confirmé dans la période courante après l'ouverture existe
                // Un placeholder d'une période différente ne bloque pas la création.
                const alreadyHandled = prevRows.some(r => {
                    if (r.compte !== ff.compte) return false;
                    const matchRef = r.fraisFixeRef === ff.id;
                    const matchDesc = r.description === description;
                    if (!matchRef && !matchDesc) return false;
                    return (
                        (r.fraisFixe === true && r.dateDepensesRecettes == null && r.fraisFixePeriode === trigger.triggerPeriode) ||
                        (
                            r.dateDepensesRecettes != null &&
                            trigger.isDateInCurrentPeriod(r.dateDepensesRecettes) &&
                            (
                                (matchRef && r.fraisFixePeriode === trigger.triggerPeriode) ||
                                new Date(r.dateDepensesRecettes) >= trigger.triggerDate
                            )
                        )
                    );
                });

                if (!alreadyHandled) {
                    toAdd.push({
                        id: randomId(),
                        compte: ff.compte,
                        description,
                        depenses: ff.type === 'Dépense' ? ff.montant : 0,
                        recettes: ff.type === 'Recette' ? ff.montant : 0,
                        notesFraisRemboursee: false,
                        fraisFixe: true,
                        chequeEnCours: false,
                        depenseRecettesAMasquer: false,
                        dateDepensesRecettes: null,
                        pourcentageMoi: ff.pourcentageMoi ?? null,
                        fraisFixePeriode: trigger.triggerPeriode,
                        fraisFixeRef: ff.id,
                        categorie: ff.categorie || '',
                        sousCategorie: ff.sousCategorie || '',
                    });
                }
            }

            if (toAdd.length === 0 && toFix.size === 0 && toRemoveIds.size === 0) return prevRows;
            let newRows = prevRows
                .filter(r => !toRemoveIds.has(r.id))
                .map(r => toFix.has(r.id) ? toFix.get(r.id) : r);
            if (toAdd.length > 0) newRows = [...toAdd, ...newRows];
            return newRows;
        });
    }, [fraisFixesRows, setRows, todayKey]);
}
