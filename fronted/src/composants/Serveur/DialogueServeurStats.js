import { useState, useEffect } from "react";
import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL;

export function useStatsMensuelles(personneProprietaire = 0) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`${baseURL}/stats-mensuelles?proprietaire=${personneProprietaire}`)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur stats mensuelles:", err);
                setError(err);
                setLoading(false);
            });
    }, [personneProprietaire]);

    return { data, loading, error };
}