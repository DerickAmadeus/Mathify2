# Create Users Table in Supabase

## Via Supabase Dashboard (Easiest)

### Step 1: Open SQL Editor
1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"+ New query"**

### Step 2: Run This SQL

Copy and paste this SQL code:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON users
  FOR SELECT
  USING (true);

-- Create policy to allow public insert
CREATE POLICY "Allow public insert" ON users
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow public update
CREATE POLICY "Allow public update" ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policy to allow public delete
CREATE POLICY "Allow public delete" ON users
  FOR DELETE
  USING (true);
```

### Step 3: Run the Query
- Click **"Run"** button (or press Ctrl/Cmd + Enter)
- You should see: `Success. No rows returned`

### Step 4: Verify Table Created
1. Click **"Table Editor"** in left sidebar
2. You should see **"users"** table
3. Columns: `id`, `name`, `email`, `created_at`

## Done! ✅

Your users table is ready to use.

---

## Alternative: Via API (Advanced)

If you prefer using code, you can also create tables programmatically, but SQL Editor is simpler.

---

## Test Your Table

After creating the table, you can test by inserting a user:

```sql
INSERT INTO users (name, email) VALUES ('Test User', 'test@example.com');
```

Or via your API once server is running:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```
