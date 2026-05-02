const supabase = require('../supabaseClient');

const makeAdmin = async (email) => {
    try {
        // Find user by email in profiles (we need to join or look up)
        // Since we don't have direct email in profiles, we look up via Auth
        // For simplicity, we'll assume the email is the user we want to update
        // In Supabase, we can use the service role to update any user, 
        // but here we just update the profile flag.
        
        const { data: users, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        const user = users.users.find(u => u.email === email);
        if (!user) {
            console.log(`User with email ${email} not found in Supabase Auth.`);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', user.id);

        if (error) throw error;
        console.log(`Success! ${email} is now an Admin.`);
    } catch (err) {
        console.error('Error:', err);
    }
};

const email = process.argv[2];
if (!email) {
    console.log('Please provide an email: node make-admin.js user@example.com');
} else {
    makeAdmin(email);
}
