const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Helper to format custom movie to app expectations
const formatMovie = (m) => ({
    ...m,
    id: m.id || m._id,
    isCustom: true,
    poster_path: m.poster_url || m.posterPath,
    vote_average: m.vote_average || 8.5
});

// Trending (Recently added internal movies)
router.get('/trending', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        res.json(data.map(formatMovie));
    } catch (err) {
        res.status(500).json({ message: 'Error fetching trending' });
    }
});

// Popular (Highest rated internal movies)
router.get('/popular', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .limit(20);
        
        if (error) throw error;
        res.json(data.map(formatMovie));
    } catch (err) {
        res.status(500).json({ message: 'Error fetching popular' });
    }
});

// Movie Details (Fetch from Internal DB)
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .eq('id', req.params.id)
            .single();
        
        if (error && error.code === 'PGRST116') {
             // Try searching by _id if id fails (MongoDB legacy)
             const { data: altData, error: altError } = await supabase
                .from('movies')
                .select('*')
                .eq('_id', req.params.id)
                .single();
             if (altError) throw altError;
             return res.json(formatMovie(altData));
        } else if (error) {
            throw error;
        }

        res.json(formatMovie(data));
    } catch (err) {
        res.status(500).json({ message: 'Movie not found in internal system' });
    }
});

// Search (Search internal DB)
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .ilike('title', `%${query}%`);
        
        if (error) throw error;
        res.json(data.map(formatMovie));
    } catch (err) {
        res.status(500).json({ message: 'Search failed' });
    }
});

module.exports = router;
