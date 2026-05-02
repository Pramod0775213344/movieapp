require('dotenv').config({ path: './.env' }); // Look in the current folder (server)
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const createAdmin = async () => {
    const email = 'admintest@gmail.com';
    const password = '123456';
    const username = 'System Admin';

    try {
        console.log('Creating Admin User...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) {
            console.error('Auth Error:', authError.message);
            return;
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert([{
                id: authData.user.id,
                username,
                is_admin: true
            }]);

        if (profileError) {
            console.error('Profile Error:', profileError.message);
            return;
        }

        console.log('Success! Admin account created successfully.');
        console.log('Email: admin@gmail.com');
        console.log('Password: 12345');
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
};

createAdmin();
