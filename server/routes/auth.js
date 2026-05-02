const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) return res.status(400).json({ message: authError.message });

        // Create profile in profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: authData.user.id, username }]);

        if (profileError) return res.status(400).json({ message: profileError.message });

        res.status(201).json({ 
            message: 'User registered successfully', 
            token: authData.session?.access_token || null,
            user: { id: authData.user.id, username, email } 
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) return res.status(400).json({ message: error.message });

        // Get profile info
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        res.json({ 
            token: data.session.access_token, 
            user: { 
                id: data.user.id, 
                username: profile?.username || 'User', 
                email: data.user.email,
                isAdmin: profile?.is_admin || false
            } 
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
