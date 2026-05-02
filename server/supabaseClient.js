const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

// Standard Client (Respects RLS)
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin Client (Bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase, supabaseAdmin };
