const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const supabase = require('../supabaseClient');
const axios = require('axios');

// Cloudflare R2 Client Config
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to upload to R2
const uploadToR2 = async (file, folder) => {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        },
    });

    await upload.done();
    return `${process.env.R2_PUBLIC_CUSTOM_DOMAIN}/${fileName}`;
};

// Proxy TMDB Search
router.get('/tmdb-search', async (req, res) => {
    try {
        const { query } = req.query;
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: { api_key: process.env.TMDB_API_KEY, query }
        });
        res.json(response.data.results);
    } catch (err) {
        res.status(500).json({ message: 'Search failed' });
    }
});

// Admin Auth Middleware
const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error();
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        if (!profile || !profile.is_admin) throw new Error();
        req.user = user;
        next();
    } catch (e) {
        res.status(403).json({ message: 'Access denied' });
    }
};

// Upload Movie to Cloudflare R2
router.post('/upload', adminAuth, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'poster', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, description, genre, duration, tmdbPosterPath } = req.body;
        
        let videoUrl = '';
        if (req.files['video']) {
            videoUrl = await uploadToR2(req.files['video'][0], 'videos');
        }

        let posterUrl = tmdbPosterPath || '';
        if (req.files['poster']) {
            posterUrl = await uploadToR2(req.files['poster'][0], 'posters');
        }

        const { data, error } = await supabase
            .from('movies')
            .insert([{
                title,
                description,
                genre: genre.split(','),
                duration: parseInt(duration),
                video_url: videoUrl,
                poster_url: posterUrl
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Movie uploaded to Cloudflare R2 successfully', movie: data[0] });
    } catch (err) {
        res.status(500).json({ message: 'Upload failed', error: err.message });
    }
});

// Get all movies
router.get('/movies', async (req, res) => {
    const { data, error } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json(error);
    res.json(data);
});

// Delete movie
router.delete('/movie/:id', adminAuth, async (req, res) => {
    const { error } = await supabase.from('movies').delete().eq('id', req.params.id);
    if (error) return res.status(500).json(error);
    res.json({ message: 'Movie deleted' });
});

// --- TV SERIES ROUTES ---

// Create TV Series
router.post('/tv-series/create', adminAuth, upload.single('poster'), async (req, res) => {
    try {
        const { title, description, genres, tmdbPosterPath } = req.body;
        let posterUrl = tmdbPosterPath || '';
        if (req.file) {
            posterUrl = await uploadToR2(req.file, 'posters');
        }

        const { data, error } = await supabase
            .from('tv_series')
            .insert([{ title, description, genres: genres.split(','), poster_url: posterUrl }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Series created', series: data[0] });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create series', error: err.message });
    }
});

// Upload Episode
router.post('/tv-series/upload-episode', adminAuth, upload.single('video'), async (req, res) => {
    try {
        const { series_id, season_number, episode_number, title } = req.body;
        let videoUrl = '';
        if (req.file) {
            videoUrl = await uploadToR2(req.file, 'videos');
        }

        const { data, error } = await supabase
            .from('episodes')
            .insert([{
                series_id,
                season_number: parseInt(season_number),
                episode_number: parseInt(episode_number),
                title,
                video_url: videoUrl
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Episode uploaded to R2', episode: data[0] });
    } catch (err) {
        res.status(500).json({ message: 'Failed to upload episode', error: err.message });
    }
});

// Get all TV Series
router.get('/tv-series', async (req, res) => {
    const { data, error } = await supabase.from('tv_series').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json(error);
    res.json(data);
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

module.exports = router;
