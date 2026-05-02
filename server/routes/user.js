const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');

// Middleware to verify user
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error();
        req.user = user;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

// Get Full Profile
router.get('/profile', auth, async (req, res) => {
    try {
        console.log('Fetching profile for user:', req.user.id);
        let { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();
        
        // SELF-HEALING: If profile doesn't exist, create it on the fly
        if (error && error.code === 'PGRST116') {
            console.log('Profile missing. Creating self-healing profile...');
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([{ id: req.user.id, username: req.user.email.split('@')[0] }])
                .select()
                .single();
            
            if (createError) throw createError;
            data = newProfile;
        } else if (error) {
            throw error;
        }

        res.json(data);
    } catch (err) {
        console.error('Profile Route Crash:', err.message);
        res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
});

// Get Watchlist
router.get('/watchlist', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('watchlist')
            .eq('id', req.user.id)
            .single();
        
        if (error) throw error;
        res.json(data.watchlist || []);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching watchlist' });
    }
});

// Add/Remove from Watchlist
router.post('/watchlist/toggle', auth, async (req, res) => {
    try {
        const { movie } = req.body;
        const { data: profile } = await supabase
            .from('profiles')
            .select('watchlist')
            .eq('id', req.user.id)
            .single();

        let watchlist = profile.watchlist || [];
        const index = watchlist.findIndex(m => m.movieId === movie.id);

        if (index > -1) {
            watchlist.splice(index, 1);
        } else {
            watchlist.push({ 
                movieId: movie.id, 
                title: movie.title, 
                posterPath: movie.poster_path 
            });
        }

        const { error } = await supabase
            .from('profiles')
            .update({ watchlist })
            .eq('id', req.user.id);

        if (error) throw error;
        res.json(watchlist);
    } catch (err) {
        res.status(500).json({ message: 'Error updating watchlist' });
    }
});

// Get History
router.get('/history', auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('history')
            .eq('id', req.user.id)
            .single();
        
        if (error) throw error;
        res.json(data.history || []);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching history' });
    }
});

module.exports = router;
