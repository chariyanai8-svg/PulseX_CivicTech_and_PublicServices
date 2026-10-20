# ⚡ Supabase Cloud Database Setup for CivicPulse

CivicPulse is fully configured to connect to **Supabase Cloud PostgreSQL** with real-time multi-device synchronization!

---

### Step 1: Create a Free Project on Supabase
1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New Project**.
3. Choose a name (e.g. `CivicPulse`), set a database password, and pick a region close to you (e.g. `Singapore`).
4. Wait ~1 minute for Supabase to provision your database.

---

### Step 2: Run the SQL Schema (1 Click)
1. In your Supabase project dashboard, open the **SQL Editor** from the left sidebar.
2. Click **New Query**.
3. Copy and paste the entire contents of [`apps/server/supabase-schema.sql`](file:///c:/Users/User/civicpulse/apps/server/supabase-schema.sql).
4. Click **Run** (green button).
5. All 6 tables (`issues`, `reports`, `verifications`, `endorsements`, `notifications`, `signals`) and policies are created immediately.

---

### Step 3: Copy Your API Keys into CivicPulse
1. In your Supabase dashboard, go to **Project Settings** (gear icon) > **API**.
2. Copy:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
3. Open [`apps/server/.env`](file:///c:/Users/User/civicpulse/apps/server/.env) and paste them:
   ```env
   PORT=3002
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Save the file!

---

### Step 4: That's It!
The backend automatically detects your keys, connects to Supabase, and auto-seeds the initial demo cases.
* Any report submitted from any phone or computer anywhere in the world will save directly to your Supabase PostgreSQL cloud database.
* All devices running the CivicPulse app will read from the same cloud database in real time.
