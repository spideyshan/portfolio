import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize client only if credentials exist, otherwise default to null
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Mock data to use as fallback if Supabase is not configured yet
const MOCK_PROFILE = {
  name: 'Shanmuga Nathan Manavalan',
  role: 'Computer Science Student & Aspiring Software Engineer',
  bio: 'I am a passionate Computer Science student focusing on modern full-stack web development. I love building responsive interfaces, learning new frameworks, and solving algorithmic problems.',
  avatar_url: 'https://lh3.googleusercontent.com/d/1TVZ-Oen9krePPrwk8dO3L_JroPKSMsWz',
  avatar_url_about: 'https://lh3.googleusercontent.com/d/1KovBCy_E1whsaxKAVIrH-AWKgNQ2GkFL',
  resume_url: '#',
  email: 'spidey@ny.com',
  github_url: 'https://github.com',
  linkedin_url: 'https://linkedin.com',
  twitter_url: 'https://twitter.com',
  location: 'New York City, NY'
};

const MOCK_PROJECTS = [
  {
    id: '1',
    title: 'EcoSync Dashboard',
    description: 'A real-time environmental monitor dashboard showing air quality metrics and carbon offset tracking.',
    tags: ['Next.js', 'Supabase', 'Vanilla CSS', 'Recharts'],
    github_url: 'https://github.com',
    live_url: 'https://example.com',
    featured: true,
    sort_order: 1
  },
  {
    id: '2',
    title: 'Aether UI Kit',
    description: 'A premium collection of glassmorphic CSS components built for modern aesthetic applications.',
    tags: ['CSS Modules', 'Web Components', 'HTML5'],
    github_url: 'https://github.com',
    live_url: 'https://example.com',
    featured: true,
    sort_order: 2
  },
  {
    id: '3',
    title: 'TaskFlow Kanban',
    description: 'A drag-and-drop collaborative tasks manager with persistent sync through Supabase Realtime.',
    tags: ['React', 'Supabase Realtime', 'CSS Grid'],
    github_url: 'https://github.com',
    live_url: 'https://example.com',
    featured: false,
    sort_order: 3
  }
];

const MOCK_SKILLS = [
  { id: '1', name: 'React / Next.js', category: 'Frontend', proficiency: 95 },
  { id: '2', name: 'TypeScript', category: 'Frontend', proficiency: 90 },
  { id: '3', name: 'CSS / CSS Modules', category: 'Frontend', proficiency: 98 },
  { id: '4', name: 'Node.js / Express', category: 'Backend', proficiency: 85 },
  { id: '5', name: 'Supabase / PostgreSQL', category: 'Backend', proficiency: 88 },
  { id: '6', name: 'Git / GitHub Actions', category: 'Tools', proficiency: 85 },
  { id: '7', name: 'Figma', category: 'Design', proficiency: 75 }
];

export interface Profile {
  name: string;
  role: string;
  bio: string;
  avatar_url?: string;
  avatar_url_about?: string;
  resume_url?: string;
  email?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  location?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  tags: string[];
  github_url?: string;
  live_url?: string;
  featured: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
}

export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

export async function getProfile(): Promise<Profile> {
  if (!supabase) {
    return MOCK_PROFILE;
  }
  try {
    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .maybeSingle();
    
    if (error || !data) {
      console.warn('Could not fetch profile from Supabase, using mock data:', error);
      return MOCK_PROFILE;
    }

    // Parse location from bio if serialized there
    const rawBio = data.bio || '';
    const delimiter = '\n||location:';
    const parts = rawBio.split(delimiter);
    if (parts.length > 1) {
      data.bio = parts[0];
      data.location = parts[1].trim();
    } else {
      data.location = (data as any).location || 'New York City, NY';
    }

    return data;
  } catch (err) {
    console.error('Error in getProfile:', err);
    return MOCK_PROFILE;
  }
}

export async function getProjects(): Promise<Project[]> {
  if (!supabase) {
    return MOCK_PROJECTS;
  }
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error || !data || data.length === 0) {
      console.warn('Could not fetch projects from Supabase, using mock data:', error);
      return MOCK_PROJECTS;
    }
    return data;
  } catch (err) {
    console.error('Error in getProjects:', err);
    return MOCK_PROJECTS;
  }
}

export async function getSkills(): Promise<Skill[]> {
  if (!supabase) {
    return MOCK_SKILLS;
  }
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error || !data || data.length === 0) {
      console.warn('Could not fetch skills from Supabase, using mock data:', error);
      return MOCK_SKILLS;
    }
    return data;
  } catch (err) {
    console.error('Error in getSkills:', err);
    return MOCK_SKILLS;
  }
}

export async function submitMessage(name: string, email: string, message: string): Promise<{ success: boolean; error?: string }> {
  // Always append message to localStorage if running on the client (so Demo Mode has access to it)
  if (typeof window !== 'undefined') {
    try {
      const localMsgStr = localStorage.getItem('portfolio_mock_messages');
      const mockMsgs = localMsgStr ? JSON.parse(localMsgStr) : [];
      mockMsgs.unshift({
        id: Date.now().toString(),
        name,
        email,
        message,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('portfolio_mock_messages', JSON.stringify(mockMsgs));
    } catch (e) {
      console.warn('Failed to store mock message locally:', e);
    }
  }

  if (!supabase) {
    console.log('Mock form submission received:', { name, email, message });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true };
  }
  try {
    const { error } = await supabase
      .from('messages')
      .insert([{ name, email, message }]);
    
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error in submitMessage:', err);
    return { success: false, error: err?.message || 'Failed to send message.' };
  }
}
