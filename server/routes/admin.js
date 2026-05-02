const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { supabase, supabaseAdmin } = require('../supabaseClient');
const axios = require('axios');
const fs = require('fs');

// Cloudflare R2 Client Config
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/tmp';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 * 1024 } // 50GB limit
});


// Admin Auth Middleware
const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) return res.status(401).json({ message: 'Missing Authorization Header' });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            console.error('Admin Auth Token Error:', error?.message);
            return res.status(401).json({ message: 'Invalid or expired session' });
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        // Check if user is admin OR if they are the primary owner (Hardcoded override for safety)
        const isSystemAdmin = user.email && user.email.toLowerCase().trim() === 'admin@gmail.com';
        
        if (profile?.is_admin === true || isSystemAdmin) {
            req.user = user;
            return next();
        }

        console.warn('Unauthorized Admin Attempt:', user.email);
        res.status(403).json({ message: `Access denied. ${user.email} is not an admin.` });
    } catch (e) {
        console.error('Admin Auth Crash:', e.message);
        res.status(500).json({ message: 'Internal Server Error during Auth' });
    }
};

// SECRET ROUTE: Make currently logged in user an Admin

// Use this once to set up your admin account!
router.post('/make-me-admin', async (req, res) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) return res.status(401).json({ message: 'Missing token' });
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error('Invalid token');

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', user.id);
        
        if (updateError) throw updateError;
        res.json({ message: `Success! ${user.email} is now an Admin.` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Helper function to upload to R2 using Stream
const uploadToR2 = async (file, folder) => {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const fileStream = fs.createReadStream(file.path);
    
    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            Body: fileStream,
            ContentType: file.mimetype,
        },
    });

    await upload.done();
    
    // Cleanup temporary file
    fs.unlinkSync(file.path);
    
    return `${process.env.R2_PUBLIC_CUSTOM_DOMAIN}/${fileName}`;
};

// 1. Start Multipart Upload
router.post('/multipart/start', adminAuth, async (req, res) => {
    try {
        const { fileName, fileType, folder } = req.body;
        const key = `${folder}/${Date.now()}-${fileName}`;
        
        const command = new CreateMultipartUploadCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        const multipartUpload = await s3Client.send(command);
        res.json({ uploadId: multipartUpload.UploadId, key });
    } catch (err) {
        console.error('Multipart start error:', err);
        res.status(500).json({ message: 'Failed to start multipart upload' });
    }
});

// 2. Get Pre-signed URL for a specific chunk
router.post('/multipart/get-url', adminAuth, async (req, res) => {
    try {
        const { uploadId, key, partNumber } = req.body;
        
        const command = new UploadPartCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        res.json({ uploadUrl });
    } catch (err) {
        console.error('Get part URL error:', err);
        res.status(500).json({ message: 'Failed to generate part URL' });
    }
});

// 3. Complete Multipart Upload
router.post('/multipart/complete', adminAuth, async (req, res) => {
    try {
        const { uploadId, key, parts } = req.body;
        
        // AWS S3 requires parts to be strictly ordered by PartNumber
        const sortedParts = parts.sort((a, b) => a.PartNumber - b.PartNumber);

        const command = new CompleteMultipartUploadCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: sortedParts.map(p => ({
                    ETag: p.ETag,
                    PartNumber: p.PartNumber
                }))
            }
        });

        await s3Client.send(command);
        const publicUrl = `${process.env.R2_PUBLIC_CUSTOM_DOMAIN}/${key}`;
        res.json({ publicUrl });
    } catch (err) {
        console.error('Multipart complete error:', err);
        res.status(500).json({ message: `Failed to assemble chunks in Cloudflare: ${err.message}` });
    }
});

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

// Finalize Movie Metadata (after direct upload)
router.post('/upload-metadata', adminAuth, async (req, res) => {
    try {
        const { title, description, genre, duration, videoUrl, posterUrl } = req.body;
        
        const { data, error } = await supabaseAdmin
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
        res.status(201).json({ message: 'Movie record created', movie: data[0] });
    } catch (err) {
        res.status(500).json({ message: 'Failed to save movie record', error: err.message });
    }
});

// Upload Movie to Cloudflare R2 (LEGACY - for small files)
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

        const { data, error } = await supabaseAdmin
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
    const { error } = await supabaseAdmin.from('movies').delete().eq('id', req.params.id);
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

        const { data, error } = await supabaseAdmin
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

        const { data, error } = await supabaseAdmin
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
