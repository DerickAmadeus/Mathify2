const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

const connectDB = async () => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in .env');
    }

    console.log('🔄 Connecting to Supabase...');
    console.log(`📍 URL: ${supabaseUrl}`);

    // Test connection by making a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist yet (ok for first time)
      throw error;
    }

    console.log('✅ Connected to Supabase successfully!');
    console.log(`📊 Database: PostgreSQL (via Supabase)`);
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    console.log('⚠️  Server will start without database connection');
    return false;
  }
};

module.exports = { connectDB, supabase };
