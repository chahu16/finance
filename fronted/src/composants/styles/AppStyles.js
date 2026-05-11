/**
 * ============================================================
 * STYLES DE L'APPLICATION PRINCIPALE
 * ============================================================
 */

export const appContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden'
};

export const appHeaderStyle = {
    flexShrink: 0,
    p: 2,
    zIndex: 1100,
    px: 3,
    pt: 2,
    pb: 0
};

export const appGridContainerStyle = {
    flexGrow: 1,
    overflow: 'hidden',
    px: 3,
    pb: 3,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
};

export const appPaperStyle = {
    flexGrow: 1,
    width: '100%',
    overflow: 'auto',
    minWidth: 0
};

export const appLoadingStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column',
    gap: '10px'
};

export const appErrorStyle = {
    padding: "20px",
    color: "red"
};

export const appTabsContainerStyle = {
    borderBottom: 1,
    borderColor: 'divider'
};

export const appAccordionDetailsStyle = {
    maxHeight: '500px'
};

export const appPlafondGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    gap: 2,
    alignItems: 'start',
};

export const appPlafondCardStyle = {
    border: '0.5px solid',
    borderColor: 'divider',
    borderRadius: 2,
    p: 2,
};

export const appPlafondTitreStyle = {
    fontWeight: 700,
    mb: 0.5,
    textAlign: 'center',
};

export const appPlafondActuelStyle = {
    display: 'block',
    mb: 1.5,
    textAlign: 'center',
};

export const appPlafondRowStyle = {
    display: 'flex',
    gap: 1,
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    minWidth: 0,
};

export const appPlafondChampStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0.5,
};

export const appPlafondInputStyle = {
    width: '100%',
    padding: '6px 10px',
    borderRadius: 4,
    border: '1px solid #ccc',
    boxSizing: 'border-box',
};

export const appPlafondTitreH6Style = {
    fontWeight: 500,
    mb: 2,
    textAlign: 'center',
};

export const appPlafondBoutonStyle = {
    padding: '6px 14px',
    borderRadius: 1,
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    alignSelf: 'flex-end',
    textTransform: 'none',
};

export const appPlafondInputErreurStyle = {
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
    boxShadow: 'inset 0 0 0 1px rgba(211, 47, 47, 0.3)',
    '& input': { color: '#d32f2f' },
};
