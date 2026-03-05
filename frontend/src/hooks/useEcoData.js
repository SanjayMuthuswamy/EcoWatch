import { useState, useEffect } from 'react';
import axios from 'axios';

export const useEcoData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/all_threats');
            setData(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch EcoWatch data:', err);
            setError(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    return { data, loading, error, refresh: fetchData };
};
