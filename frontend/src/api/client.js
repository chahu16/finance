export const API_BASE = process.env.REACT_APP_API_URL
    || `http://${window.location.hostname}:8000/finances`;

const AUTH_API = process.env.NODE_ENV === 'development'
    ? `http://${window.location.hostname}:8200`
    : '/auth-api';

// DD/MM/YYYY — seul format non-ISO accepté par formaterDateMidi côté backend.
export const formatDate = (date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// --- Auth token management ---

let accessToken = null;
let refreshPromise = null;

async function doRefresh() {
    const res = await fetch(`${AUTH_API}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Session expirée');
    const data = await res.json();
    accessToken = data.accessToken;
    return accessToken;
}

async function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
}

export async function initAuth() {
    await refreshAccessToken();
}

export function getPermissionsFromToken() {
    if (!accessToken) return null;
    try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        return payload.permissions ?? null;
    } catch {
        return null;
    }
}

function authHeaders() {
    const h = { 'Content-Type': 'application/json' };
    if (accessToken) h['Authorization'] = `Bearer ${accessToken}`;
    return h;
}

async function withAutoRefresh(fn) {
    try {
        return await fn();
    } catch (err) {
        if (err?.status === 401 || err?.message === 'Session expirée') {
            await refreshAccessToken();
            return fn();
        }
        throw err;
    }
}

// --- HTTP helpers ---

export const get = async (path) => {
    const doRequest = async () => {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: authHeaders(),
            credentials: 'include',
        });
        if (res.status === 401) {
            const err = new Error('Session expirée');
            err.status = 401;
            throw err;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erreur serveur');
        return json;
    };
    return withAutoRefresh(doRequest);
};

export const post = async (path, body) => {
    const doRequest = async () => {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: authHeaders(),
            credentials: 'include',
            body: JSON.stringify(body),
        });
        if (res.status === 401) {
            const err = new Error('Session expirée');
            err.status = 401;
            throw err;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erreur serveur');
        return json;
    };
    return withAutoRefresh(doRequest);
};
