-- Create table for Profile details
CREATE TABLE IF NOT EXISTS public.profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT NOT NULL,
    avatar_url TEXT,
    avatar_url_about TEXT,
    resume_url TEXT,
    email TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    location TEXT DEFAULT 'New York City, NY',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
    github_url TEXT,
    live_url TEXT,
    featured BOOLEAN DEFAULT false NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for Skills
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'Frontend', 'Backend', 'Tools', 'Design'
    proficiency INTEGER DEFAULT 100 NOT NULL, -- e.g., 0-100 percentage
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for Contact Form Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow safe re-runs)
DROP POLICY IF EXISTS "Allow public read access to profile" ON public.profile;
DROP POLICY IF EXISTS "Allow public read access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public read access to skills" ON public.skills;
DROP POLICY IF EXISTS "Allow public insert-only access to messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to modify profile" ON public.profile;
DROP POLICY IF EXISTS "Allow authenticated users to modify projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to modify skills" ON public.skills;
DROP POLICY IF EXISTS "Allow authenticated users to modify messages" ON public.messages;

-- Create Policies (Public Access)
CREATE POLICY "Allow public read access to profile" 
    ON public.profile FOR SELECT 
    USING (true);

CREATE POLICY "Allow public read access to projects" 
    ON public.projects FOR SELECT 
    USING (true);

CREATE POLICY "Allow public read access to skills" 
    ON public.skills FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert-only access to messages" 
    ON public.messages FOR INSERT 
    WITH CHECK (true);

-- Create Policies (Authenticated Admin Access)
CREATE POLICY "Allow authenticated users to modify profile" 
    ON public.profile FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to modify projects" 
    ON public.projects FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to modify skills" 
    ON public.skills FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to modify messages" 
    ON public.messages FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- Insert dummy data for initialization (optional, helpful for preview)
INSERT INTO public.profile (name, role, bio, avatar_url, avatar_url_about, resume_url, github_url, linkedin_url, email, location)
VALUES (
    'Shanmuga Nathan Manavalan', 
    'Computer Science Student & Aspiring Software Engineer', 
    'I am a passionate Computer Science student focusing on modern full-stack web development. I love building responsive interfaces, learning new frameworks, and solving algorithmic problems.',
    'https://lh3.googleusercontent.com/d/1TVZ-Oen9krePPrwk8dO3L_JroPKSMsWz',
    'https://lh3.googleusercontent.com/d/1KovBCy_E1whsaxKAVIrH-AWKgNQ2GkFL',
    '/resume.pdf',
    'https://github.com',
    'https://linkedin.com',
    'spidey@ny.com',
    'New York City, NY'
) ON CONFLICT DO NOTHING;

INSERT INTO public.projects (title, description, tags, github_url, live_url, featured, sort_order)
VALUES 
(
    'EcoSync Dashboard', 
    'A real-time environmental monitor dashboard showing air quality metrics and carbon offset tracking.', 
    ARRAY['Next.js', 'Supabase', 'Vanilla CSS', 'Recharts'],
    'https://github.com',
    'https://example.com',
    true,
    1
),
(
    'Aether UI Kit', 
    'A premium collection of glassmorphic CSS components built for modern aesthetic applications.', 
    ARRAY['CSS Modules', 'Web Components', 'HTML5'],
    'https://github.com',
    'https://example.com',
    true,
    2
),
(
    'TaskFlow Kanban', 
    'A drag-and-drop collaborative tasks manager with persistent sync through Supabase Realtime.', 
    ARRAY['React', 'Supabase Realtime', 'CSS Grid'],
    'https://github.com',
    'https://example.com',
    false,
    3
) ON CONFLICT DO NOTHING;

INSERT INTO public.skills (name, category, proficiency, sort_order)
VALUES 
('React / Next.js', 'Frontend', 95, 1),
('TypeScript', 'Frontend', 90, 2),
('CSS / CSS Modules', 'Frontend', 98, 3),
('Node.js / Express', 'Backend', 85, 4),
('Supabase / PostgreSQL', 'Backend', 88, 5),
('Git / GitHub Actions', 'Tools', 85, 6),
('Figma', 'Design', 75, 7) ON CONFLICT DO NOTHING;

-- Create table for Education
CREATE TABLE IF NOT EXISTS public.education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field_of_study TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    gpa TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    awarder TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for Certifications
CREATE TABLE IF NOT EXISTS public.certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    date TEXT NOT NULL,
    credential_url TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public Access)
CREATE POLICY "Allow public read access to education" ON public.education FOR SELECT USING (true);
CREATE POLICY "Allow public read access to achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Allow public read access to certifications" ON public.certifications FOR SELECT USING (true);

-- Create Policies (Authenticated Admin Access)
CREATE POLICY "Allow authenticated users to modify education" ON public.education FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to modify achievements" ON public.achievements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to modify certifications" ON public.certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert dummy data for Education
INSERT INTO public.education (institution, degree, field_of_study, start_date, end_date, gpa, description, sort_order)
VALUES 
('New York University', 'Bachelor of Science', 'Computer Science', '2023', '2027', '3.9 / 4.0', 'Focused on Software Engineering, Databases, and Web Development. Active member of the NYU Computer Science Club.', 1)
ON CONFLICT DO NOTHING;

-- Insert dummy data for Achievements
INSERT INTO public.achievements (title, awarder, date, description, sort_order)
VALUES 
('1st Place - NYU Hackathon', 'NYU Tech Club', 'Oct 2025', 'Built a real-time smart recycling tracker using Next.js and Supabase, competing against 50+ teams.', 1),
('Dean\'s List', 'NYU Department of Computer Science', 'June 2025', 'Recognized for maintaining a GPA of 3.85 or higher during the academic year.', 2)
ON CONFLICT DO NOTHING;

-- Insert dummy data for Certifications
INSERT INTO public.certifications (name, issuer, date, credential_url, sort_order)
VALUES 
('AWS Certified Cloud Practitioner', 'Amazon Web Services', 'Jan 2026', 'https://aws.amazon.com', 1),
('Google Cloud Digital Leader', 'Google Cloud', 'Nov 2025', 'https://cloud.google.com', 2)
ON CONFLICT DO NOTHING;

