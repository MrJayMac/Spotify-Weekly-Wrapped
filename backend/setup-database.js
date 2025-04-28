require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Setting up Supabase database tables...');

  try {
    // Create user_tokens table to store Spotify tokens
    const { error: tokenError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'user_tokens',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        user_id text,
        access_token text not null,
        refresh_token text not null,
        expires_in integer not null,
        created_at timestamp with time zone default now(),
        unique(user_id)
      `
    });

    if (tokenError) {
      console.error('Error creating user_tokens table:', tokenError);
    } else {
      console.log('✓ user_tokens table created or already exists');
    }

    // Create listening_history table to store track plays
    const { error: historyError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'listening_history',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        user_id text,
        track_id text not null,
        track_name text not null,
        artist_name text not null,
        played_at timestamp with time zone not null,
        album_name text,
        album_image text,
        duration_ms integer,
        audio_features jsonb,
        created_at timestamp with time zone default now()
      `
    });

    if (historyError) {
      console.error('Error creating listening_history table:', historyError);
    } else {
      console.log('✓ listening_history table created or already exists');
    }

    // Create weekly_analytics table to store processed analytics
    const { error: analyticsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'weekly_analytics',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        user_id text not null,
        week_ending timestamp with time zone not null,
        analysis_results jsonb not null,
        created_at timestamp with time zone default now(),
        unique(user_id, week_ending)
      `
    });

    if (analyticsError) {
      console.error('Error creating weekly_analytics table:', analyticsError);
    } else {
      console.log('✓ weekly_analytics table created or already exists');
    }

    // Create track_similarities table for recommendation engine
    const { error: similaritiesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'track_similarities',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        track_id text not null,
        similar_track_id text not null,
        similarity_score float not null,
        created_at timestamp with time zone default now(),
        unique(track_id, similar_track_id)
      `
    });

    if (similaritiesError) {
      console.error('Error creating track_similarities table:', similaritiesError);
    } else {
      console.log('✓ track_similarities table created or already exists');
    }

    // Create user_preferences table
    const { error: preferencesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'user_preferences',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        user_id text not null,
        email_notifications boolean default false,
        theme text default 'dark',
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now(),
        unique(user_id)
      `
    });

    if (preferencesError) {
      console.error('Error creating user_preferences table:', preferencesError);
    } else {
      console.log('✓ user_preferences table created or already exists');
    }

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Run the setup
setupDatabase();
