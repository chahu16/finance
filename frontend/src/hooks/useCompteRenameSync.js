import { useRef, useEffect } from 'react';

export function useCompteRenameSync(comptesRows, { setRows, setFraisFixesRows, setVirementInternesRows }) {
    const prevComptesRowsRef = useRef(comptesRows);

    useEffect(() => {
        const prev = prevComptesRowsRef.current;
        const renames = [];
        prev.forEach(oldC => {
            const newC = comptesRows.find(c => c.id === oldC.id);
            if (newC && newC.nomCompte !== oldC.nomCompte) {
                renames.push({ oldName: oldC.nomCompte, newName: newC.nomCompte });
            }
        });
        prevComptesRowsRef.current = comptesRows;
        if (renames.length === 0) return;

        setRows(prev => prev.map(r => {
            const rename = renames.find(rn => rn.oldName === r.compte);
            return rename ? { ...r, compte: rename.newName } : r;
        }));
        setFraisFixesRows(prev => prev.map(r => {
            const rename = renames.find(rn => rn.oldName === r.compte);
            return rename ? { ...r, compte: rename.newName } : r;
        }));
        setVirementInternesRows(prev => prev.map(v => {
            let updated = { ...v };
            for (const { oldName, newName } of renames) {
                if (updated.compteSource === oldName) updated = { ...updated, compteSource: newName };
                if (updated.compteDestination === oldName) updated = { ...updated, compteDestination: newName };
            }
            return updated;
        }));
    }, [comptesRows, setRows, setFraisFixesRows, setVirementInternesRows]);
}
