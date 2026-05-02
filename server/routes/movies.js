const express = require('express');
const router = express.Router();
const axios = require('axios');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Helper to fetch from TMDB
const fetchFromTMDB = async (endpoint, params = {}) => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
            params: {
                api_key: TMDB_API_KEY,
                ...params
            }
        });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.status_message || 'TMDB API Error');
    }
};

// Trending
router.get('/trending', async (req, res) => {
    try {
        const data = await fetchFromTMDB('/trending/movie/week');
        res.json(data.results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Popular
router.get('/popular', async (req, res) => {
    try {
        const data = await fetchFromTMDB('/movie/popular');
        res.json(data.results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Movie Details
router.get('/:id', async (req, res) => {
    try {
        const data = await fetchFromTMDB(`/movie/${req.params.id}`, { append_to_response: 'videos,credits,recommendations' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Search
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        const data = await fetchFromTMDB('/search/movie', { query });
        res.json(data.results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Exclusives (Supabase Movies)
router.get('/exclusives/all', async (req, res) => {
    try {
        const supabase = require('../supabaseClient');
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching exclusives' });
    }
});

module.exports = router;
