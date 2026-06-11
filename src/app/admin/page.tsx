'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  supabase, 
  isSupabaseConfigured, 
  Profile, 
  Project, 
  Skill 
} from '@/lib/supabase';
import styles from './admin.module.css';

const getProficiencyLabel = (pct: number): string => {
  if (pct <= 40) return 'Beginner';
  if (pct <= 75) return 'Intermediate';
  if (pct <= 90) return 'Advanced';
  return 'Expert';
};

const mapToClosestValue = (pct: number | undefined): number => {
  if (pct === undefined) return 85;
  if (pct <= 40) return 30;
  if (pct <= 75) return 65;
  if (pct <= 90) return 85;
  return 95;
};

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'projects' | 'skills' | 'messages'>('profile');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Core Data States
  const [profile, setProfile] = useState<Profile>({ name: '', role: '', bio: '' });
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // CRUD Editing States
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);

  // Category Management States
  const [emptyCategories, setEmptyCategories] = useState<string[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const catName = newCatName.trim();
    
    const activeCats = Array.from(new Set(skills.map((s) => s.category))).filter(Boolean);
    if (activeCats.includes(catName) || emptyCategories.includes(catName)) {
      showStatus('error', `Category "${catName}" already exists.`);
      return;
    }
    
    setEmptyCategories([...emptyCategories, catName]);
    setNewCatName('');
    setShowAddCat(false);
    showStatus('success', `Category "${catName}" created! Click "+ Add ${catName} Skill" below to add a skill.`);
  };

  // Authentication Guard & Data Load
  useEffect(() => {
    async function checkAuth() {
      // Check if there is local demo data in localStorage
      const localProfile = localStorage.getItem('portfolio_mock_profile');
      if (localProfile) {
        setHasLocalData(true);
      }

      try {
        const isTwoFactorVerified = localStorage.getItem('portfolio_admin_2fa_verified') === 'true';
        if (!isTwoFactorVerified) {
          router.push('/admin/login');
          return;
        }

        if (isSupabaseConfigured() && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.push('/admin/login');
            return;
          }
          setIsDemo(false);
          await loadSupabaseData();
        } else {
          const mockSession = localStorage.getItem('portfolio_mock_session');
          if (mockSession !== 'true') {
            router.push('/admin/login');
            return;
          }
          setIsDemo(true);
          loadMockData();
        }
      } catch (err) {
        console.warn('Network error or connection failed in checkAuth, falling back to offline demo mode:', err);
        setIsDemo(true);
        loadMockData();
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // Load live data from Supabase
  const loadSupabaseData = async () => {
    if (!supabase) return;
    try {
      // Fetch Profile
      const { data: profData } = await supabase.from('profile').select('*').maybeSingle();
      if (profData) setProfile(profData);

      // Fetch Projects
      const { data: projData } = await supabase.from('projects').select('*').order('sort_order', { ascending: true });
      if (projData) setProjects(projData);

      // Fetch Skills
      const { data: skillData } = await supabase.from('skills').select('*').order('sort_order', { ascending: true });
      if (skillData) setSkills(skillData);

      // Fetch Messages
      const { data: msgData } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (msgData) setMessages(msgData);
    } catch (err) {
      console.error('Error loading Supabase data:', err);
    }
  };

  // Load and cache mock data from localStorage
  const loadMockData = () => {
    // Helper to get or set mock data
    const getOrInit = (key: string, defaultVal: any) => {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    };

    const cachedProfile = getOrInit('portfolio_mock_profile', {
      name: 'Shanmuga Nathan Manavalan',
      role: 'Computer Science Student & Aspiring Software Engineer',
      bio: 'I am a passionate Computer Science student focusing on modern full-stack web development. I love building responsive interfaces, learning new frameworks, and solving algorithmic problems.',
      avatar_url: 'https://lh3.googleusercontent.com/d/1TVZ-Oen9krePPrwk8dO3L_JroPKSMsWz',
      avatar_url_about: 'https://lh3.googleusercontent.com/d/1KovBCy_E1whsaxKAVIrH-AWKgNQ2GkFL',
      email: 'abc@gmail.com',
      github_url: 'https://github.com',
      linkedin_url: 'https://linkedin.com',
      twitter_url: 'https://twitter.com',
      location: 'New York City, NY'
    });

    // Auto-update cached profile if it uses placeholder details
    let needsUpdate = false;
    if (cachedProfile.name === 'Peter Parker') {
      cachedProfile.name = 'Shanmuga Nathan Manavalan';
      needsUpdate = true;
    }
    if (!cachedProfile.avatar_url_about) {
      cachedProfile.avatar_url_about = 'https://lh3.googleusercontent.com/d/1KovBCy_E1whsaxKAVIrH-AWKgNQ2GkFL';
      needsUpdate = true;
    }
    if (!cachedProfile.location) {
      cachedProfile.location = 'New York City, NY';
      needsUpdate = true;
    }
    if (cachedProfile.avatar_url && cachedProfile.avatar_url.includes('unsplash.com')) {
      cachedProfile.avatar_url = 'https://lh3.googleusercontent.com/d/1TVZ-Oen9krePPrwk8dO3L_JroPKSMsWz';
      needsUpdate = true;
    }
    if (needsUpdate) {
      localStorage.setItem('portfolio_mock_profile', JSON.stringify(cachedProfile));
    }

    setProfile(cachedProfile);

    setProjects(getOrInit('portfolio_mock_projects', [
      {
        id: '1',
        title: 'EcoSync Dashboard',
        description: 'A real-time environmental monitor dashboard showing air quality metrics and carbon offset tracking.',
        tags: ['Next.js', 'Supabase', 'Vanilla CSS', 'Recharts'],
        github_url: 'https://github.com',
        live_url: 'https://example.com',
        featured: true
      },
      {
        id: '2',
        title: 'Aether UI Kit',
        description: 'A premium collection of glassmorphic CSS components built for modern aesthetic applications.',
        tags: ['CSS Modules', 'Web Components', 'HTML5'],
        github_url: 'https://github.com',
        live_url: 'https://example.com',
        featured: true
      }
    ]));

    setSkills(getOrInit('portfolio_mock_skills', [
      { id: '1', name: 'React / Next.js', category: 'Frontend', proficiency: 95 },
      { id: '2', name: 'TypeScript', category: 'Frontend', proficiency: 90 },
      { id: '3', name: 'CSS / CSS Modules', category: 'Frontend', proficiency: 98 }
    ]));

    setMessages(getOrInit('portfolio_mock_messages', [
      {
        id: '1',
        name: 'Tony Stark',
        email: 'tony@stark.com',
        message: 'Kid, love the portfolio design. Let\'s collaborate on an interface for the new suit dashboard.',
        created_at: new Date().toISOString()
      }
    ]));
  };

  const handleLogout = async () => {
    if (isDemo) {
      localStorage.removeItem('portfolio_mock_session');
      router.push('/');
    } else if (supabase) {
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
    setStatus({ type, text });
    setTimeout(() => setStatus(null), 4000);
  };

  // ==========================================
  // PROFILE SUBMIT
  // ==========================================
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      localStorage.setItem('portfolio_mock_profile', JSON.stringify(profile));
      showStatus('success', 'Demo profile saved to localStorage!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('profile').upsert({
        id: (profile as any).id || undefined,
        name: profile.name,
        role: profile.role,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        avatar_url_about: profile.avatar_url_about,
        resume_url: profile.resume_url,
        email: profile.email,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url,
        twitter_url: profile.twitter_url,
        location: profile.location,
        updated_at: new Date().toISOString()
      });

      if (error) {
        showStatus('error', `Error updating profile: ${error.message}`);
      } else {
        showStatus('success', 'Profile updated successfully in Supabase!');
        loadSupabaseData();
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to update profile.');
    }
  };

  // ==========================================
  // PROJECT CRUD ACTION HANDLERS
  // ==========================================
  const handleProjectSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject?.title || !editingProject.description) {
      showStatus('error', 'Title and description are required.');
      return;
    }

    const tagsArray = typeof editingProject.tags === 'string'
      ? (editingProject.tags as string).split(',').map((t) => t.trim()).filter(Boolean)
      : editingProject.tags || [];

    const projectData = {
      ...editingProject,
      tags: tagsArray,
      featured: editingProject.featured || false,
    };

    if (isDemo) {
      let updatedProjects;
      if (projectData.id) {
        // Edit existing
        updatedProjects = projects.map((p) => p.id === projectData.id ? (projectData as Project) : p);
      } else {
        // Add new
        const newProj = { ...projectData, id: Date.now().toString() } as Project;
        updatedProjects = [...projects, newProj];
      }
      setProjects(updatedProjects);
      localStorage.setItem('portfolio_mock_projects', JSON.stringify(updatedProjects));
      setEditingProject(null);
      showStatus('success', 'Demo project saved!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('projects').upsert([
        {
          id: projectData.id || undefined,
          title: projectData.title,
          description: projectData.description,
          tags: projectData.tags,
          github_url: projectData.github_url,
          live_url: projectData.live_url,
          featured: projectData.featured,
          sort_order: (projectData as any).sort_order || 0
        }
      ]);

      if (error) {
        showStatus('error', `Error: ${error.message}`);
      } else {
        showStatus('success', 'Project saved to Supabase!');
        setEditingProject(null);
        loadSupabaseData();
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to save project.');
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    if (isDemo) {
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);
      localStorage.setItem('portfolio_mock_projects', JSON.stringify(updated));
      showStatus('success', 'Demo project deleted!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) {
        showStatus('error', `Delete failed: ${error.message}`);
      } else {
        showStatus('success', 'Project deleted!');
        loadSupabaseData();
      }
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  // ==========================================
  // SKILL CRUD ACTION HANDLERS
  // ==========================================
  const handleSkillSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill?.name || !editingSkill.category) {
      showStatus('error', 'Name and category are required.');
      return;
    }

    const proficiencyVal = typeof editingSkill.proficiency === 'number' 
      ? editingSkill.proficiency 
      : parseInt(editingSkill.proficiency as any) || 80;

    const skillData = {
      ...editingSkill,
      proficiency: proficiencyVal,
    };

    if (isDemo) {
      let updatedSkills;
      if (skillData.id) {
        // Edit existing
        updatedSkills = skills.map((s) => s.id === skillData.id ? (skillData as Skill) : s);
      } else {
        // Add new
        const newSkill = { ...skillData, id: Date.now().toString() } as Skill;
        updatedSkills = [...skills, newSkill];
      }
      setSkills(updatedSkills);
      localStorage.setItem('portfolio_mock_skills', JSON.stringify(updatedSkills));
      setEditingSkill(null);
      showStatus('success', 'Demo skill saved!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('skills').upsert([
        {
          id: skillData.id || undefined,
          name: skillData.name,
          category: skillData.category,
          proficiency: skillData.proficiency,
          sort_order: (skillData as any).sort_order || 0
        }
      ]);

      if (error) {
        showStatus('error', `Error: ${error.message}`);
      } else {
        showStatus('success', 'Skill saved to Supabase!');
        setEditingSkill(null);
        loadSupabaseData();
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to save skill.');
    }
  };

  const deleteSkill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    if (isDemo) {
      const updated = skills.filter((s) => s.id !== id);
      setSkills(updated);
      localStorage.setItem('portfolio_mock_skills', JSON.stringify(updated));
      showStatus('success', 'Demo skill deleted!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('skills').delete().eq('id', id);
      if (error) {
        showStatus('error', `Delete failed: ${error.message}`);
      } else {
        showStatus('success', 'Skill deleted!');
        loadSupabaseData();
      }
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  // ==========================================
  // MESSAGE HANDLERS
  // ==========================================
  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    if (isDemo) {
      const updated = messages.filter((m) => m.id !== id);
      setMessages(updated);
      localStorage.setItem('portfolio_mock_messages', JSON.stringify(updated));
      showStatus('success', 'Demo message deleted!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) {
        showStatus('error', `Delete failed: ${error.message}`);
      } else {
        showStatus('success', 'Message deleted!');
        loadSupabaseData();
      }
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  // ==========================================
  // EXPORT / MIGRATION ACTIONS
  // ==========================================
  const handleExportSQL = () => {
    try {
      let sqlContent = `-- Portfolio Database Backup / Seed Data\n`;
      sqlContent += `-- Generated on: ${new Date().toISOString()}\n\n`;

      sqlContent += `-- ==========================================\n`;
      sqlContent += `-- TABLE: profile\n`;
      sqlContent += `-- ==========================================\n`;
      sqlContent += `TRUNCATE TABLE public.profile CASCADE;\n\n`;

      const escapeVal = (val: any) => {
        if (val === undefined || val === null) return 'NULL';
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (typeof val === 'number') return val.toString();
        return `'${val.toString().replace(/'/g, "''")}'`;
      };

      sqlContent += `INSERT INTO public.profile (name, role, bio, avatar_url, avatar_url_about, email, github_url, linkedin_url, twitter_url, location)\nVALUES (\n`;
      sqlContent += `  ${escapeVal(profile.name)},\n`;
      sqlContent += `  ${escapeVal(profile.role)},\n`;
      sqlContent += `  ${escapeVal(profile.bio)},\n`;
      sqlContent += `  ${escapeVal(profile.avatar_url)},\n`;
      sqlContent += `  ${escapeVal(profile.avatar_url_about)},\n`;
      sqlContent += `  ${escapeVal(profile.email)},\n`;
      sqlContent += `  ${escapeVal(profile.github_url)},\n`;
      sqlContent += `  ${escapeVal(profile.linkedin_url)},\n`;
      sqlContent += `  ${escapeVal(profile.twitter_url)},\n`;
      sqlContent += `  ${escapeVal(profile.location)}\n`;
      sqlContent += `);\n\n`;

      sqlContent += `-- ==========================================\n`;
      sqlContent += `-- TABLE: projects\n`;
      sqlContent += `-- ==========================================\n`;
      sqlContent += `TRUNCATE TABLE public.projects CASCADE;\n\n`;

      if (projects.length > 0) {
        sqlContent += `INSERT INTO public.projects (title, description, tags, github_url, live_url, featured, sort_order)\nVALUES\n`;
        const projRows = projects.map((p, idx) => {
          const tagsSql = p.tags && p.tags.length > 0 
            ? `ARRAY[${p.tags.map(t => escapeVal(t)).join(', ')}]::text[]`
            : `'{}'::text[]`;
          const isLast = idx === projects.length - 1;
          return `  (${escapeVal(p.title)}, ${escapeVal(p.description)}, ${tagsSql}, ${escapeVal(p.github_url)}, ${escapeVal(p.live_url)}, ${escapeVal(p.featured)}, ${idx + 1})${isLast ? ';' : ','}`;
        });
        sqlContent += projRows.join('\n') + `\n\n`;
      }

      sqlContent += `-- ==========================================\n`;
      sqlContent += `-- TABLE: skills\n`;
      sqlContent += `-- ==========================================\n`;
      sqlContent += `TRUNCATE TABLE public.skills CASCADE;\n\n`;

      if (skills.length > 0) {
        sqlContent += `INSERT INTO public.skills (name, category, proficiency, sort_order)\nVALUES\n`;
        const skillRows = skills.map((s, idx) => {
          const isLast = idx === skills.length - 1;
          return `  (${escapeVal(s.name)}, ${escapeVal(s.category)}, ${s.proficiency}, ${idx + 1})${isLast ? ';' : ','}`;
        });
        sqlContent += skillRows.join('\n') + `\n\n`;
      }

      const blob = new Blob([sqlContent], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `supabase_portfolio_dump_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showStatus('success', 'SQL dump file downloaded successfully!');
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to generate SQL dump.');
    }
  };

  const handleSyncLocalData = async () => {
    if (!supabase || isDemo) return;

    if (!confirm('This will copy all data from local storage (demo mode) and upload it to Supabase, replacing any existing items on the server. Continue?')) {
      return;
    }

    showStatus('info', 'Syncing local data to Supabase... Please do not close this window.');

    try {
      // 1. Sync Profile
      const localProfile = localStorage.getItem('portfolio_mock_profile');
      if (localProfile) {
        const p = JSON.parse(localProfile);
        const profileToUpsert = {
          name: p.name,
          role: p.role,
          bio: p.bio,
          avatar_url: p.avatar_url,
          avatar_url_about: p.avatar_url_about,
          resume_url: p.resume_url,
          email: p.email,
          github_url: p.github_url,
          linkedin_url: p.linkedin_url,
          twitter_url: p.twitter_url,
          location: p.location,
        };

        const { data: existingProf } = await supabase.from('profile').select('id').maybeSingle();
        const { error: profError } = await supabase.from('profile').upsert({
          id: existingProf?.id || undefined,
          ...profileToUpsert,
          updated_at: new Date().toISOString()
        });
        if (profError) throw new Error(`Profile sync failed: ${profError.message}`);
      }

      // 2. Sync Projects
      const localProjects = localStorage.getItem('portfolio_mock_projects');
      if (localProjects) {
        const projs = JSON.parse(localProjects) as Project[];
        const { error: clearProjError } = await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (clearProjError) throw new Error(`Failed to clear projects: ${clearProjError.message}`);

        for (const p of projs) {
          const projToUpsert = {
            title: p.title,
            description: p.description,
            tags: p.tags,
            github_url: p.github_url,
            live_url: p.live_url,
            featured: p.featured,
            sort_order: (p as any).sort_order || 0
          };
          const { error: projError } = await supabase.from('projects').insert(projToUpsert);
          if (projError) throw new Error(`Project "${p.title}" sync failed: ${projError.message}`);
        }
      }

      // 3. Sync Skills
      const localSkills = localStorage.getItem('portfolio_mock_skills');
      if (localSkills) {
        const sks = JSON.parse(localSkills) as Skill[];
        const { error: clearSkillError } = await supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (clearSkillError) throw new Error(`Failed to clear skills: ${clearSkillError.message}`);

        for (const s of sks) {
          const skillToUpsert = {
            name: s.name,
            category: s.category,
            proficiency: s.proficiency,
            sort_order: (s as any).sort_order || 0
          };
          const { error: skillError } = await supabase.from('skills').insert(skillToUpsert);
          if (skillError) throw new Error(`Skill "${s.name}" sync failed: ${skillError.message}`);
        }
      }

      // 4. Sync Messages
      const localMessages = localStorage.getItem('portfolio_mock_messages');
      if (localMessages) {
        const msgs = JSON.parse(localMessages) as Message[];
        const { error: clearMsgError } = await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (clearMsgError) throw new Error(`Failed to clear messages: ${clearMsgError.message}`);

        for (const m of msgs) {
          const msgToInsert = {
            name: m.name,
            email: m.email,
            message: m.message,
            created_at: m.created_at || new Date().toISOString()
          };
          const { error: msgError } = await supabase.from('messages').insert(msgToInsert);
          if (msgError) throw new Error(`Message sync failed: ${msgError.message}`);
        }
      }

      showStatus('success', 'Successfully synchronized all local data to Supabase!');
      await loadSupabaseData();
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to sync data to Supabase.');
    }
  };

  if (authLoading) {
    return (
      <div className={styles.loginWrapper}>
        <div className={styles.alert} style={{ color: 'var(--color-accent)' }}>
          Loading Admin Session...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Header Info */}
      <header className={styles.adminHeader}>
        <div className={styles.adminTitleRow}>
          <h1 className={styles.adminTitle}>Dashboard</h1>
          <p className={styles.adminSubtitle}>
            {isDemo 
              ? '💡 Running in Offline Demo Mode. Changes are stored locally.' 
              : '⚡ Connected to Supabase Production.'}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={handleExportSQL} 
            className={styles.exportBtn}
            title="Download SQL script to populate your Supabase database"
          >
            📥 Export SQL Dump
          </button>
          {!isDemo && hasLocalData && (
            <button 
              onClick={handleSyncLocalData} 
              className={styles.syncBtn}
              title="Push offline demo data into Supabase"
            >
              🔄 Sync Demo Data to Supabase
            </button>
          )}
          <a href="/" className={styles.logoutBtn}>
            View Website
          </a>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Action Alerts */}
      {status && (
        <div className={`${styles.alert} ${
          status.type === 'success' 
            ? styles.alertSuccess 
            : status.type === 'error' 
              ? styles.alertError 
              : styles.alertInfo
        }`} role="status">
          {status.text}
        </div>
      )}

      {/* Tabs list */}
      <nav className={styles.tabNav}>
        <button 
          onClick={() => { setActiveTab('profile'); setEditingProject(null); setEditingSkill(null); }} 
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
        >
          Profile details
        </button>
        <button 
          onClick={() => { setActiveTab('projects'); setEditingProject(null); setEditingSkill(null); }} 
          className={`${styles.tabBtn} ${activeTab === 'projects' ? styles.tabBtnActive : ''}`}
        >
          Manage Projects
        </button>
        <button 
          onClick={() => { setActiveTab('skills'); setEditingProject(null); setEditingSkill(null); }} 
          className={`${styles.tabBtn} ${activeTab === 'skills' ? styles.tabBtnActive : ''}`}
        >
          Manage Skills
        </button>
        <button 
          onClick={() => { setActiveTab('messages'); setEditingProject(null); setEditingSkill(null); }} 
          className={`${styles.tabBtn} ${activeTab === 'messages' ? styles.tabBtnActive : ''}`}
        >
          Inbox ({messages.length})
        </button>
      </nav>

      <main className={styles.dashboardContent}>
        {/* ==========================================
           TAB: PROFILE EDITOR
           ========================================== */}
        {activeTab === 'profile' && (
          <section className={styles.formSection}>
            <form onSubmit={handleProfileSave} className={styles.formGrid}>
              <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Name</label>
                  <input
                    type="text"
                    value={profile.name || ''}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Role Title</label>
                  <input
                    type="text"
                    value={profile.role || ''}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    required
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Short Bio</label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  required
                  rows={4}
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hero Avatar URL</label>
                  <input
                    type="text"
                    value={profile.avatar_url || ''}
                    onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>About Avatar URL</label>
                  <input
                    type="text"
                    value={profile.avatar_url_about || ''}
                    onChange={(e) => setProfile({ ...profile, avatar_url_about: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Contact Email</label>
                  <input
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Resume URL</label>
                  <input
                    type="text"
                    value={profile.resume_url || ''}
                    onChange={(e) => setProfile({ ...profile, resume_url: e.target.value })}
                    className={styles.formInput}
                    placeholder="e.g. /resume.pdf"
                  />
                </div>
              </div>

              <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>GitHub URL</label>
                  <input
                    type="text"
                    value={profile.github_url || ''}
                    onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>LinkedIn URL</label>
                  <input
                    type="text"
                    value={profile.linkedin_url || ''}
                    onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Twitter URL</label>
                  <input
                    type="text"
                    value={profile.twitter_url || ''}
                    onChange={(e) => setProfile({ ...profile, twitter_url: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Location</label>
                  <input
                    type="text"
                    value={profile.location || ''}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className={styles.formInput}
                    placeholder="New York City, NY"
                  />
                </div>
              </div>

              <div>
                <button type="submit" className={styles.saveBtn}>Save Details</button>
              </div>
            </form>
          </section>
        )}

        {/* ==========================================
           TAB: MANAGE PROJECTS
           ========================================== */}
        {activeTab === 'projects' && (
          <div>
            {!editingProject ? (
              <div>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Projects List</h2>
                  <button 
                    onClick={() => setEditingProject({ title: '', description: '', tags: [], featured: false })} 
                    className={styles.newBtn}
                  >
                    + Add Project
                  </button>
                </div>
                
                <div className={styles.tableWrapper}>
                  <table className={styles.itemTable}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th>Title</th>
                        <th>Tags</th>
                        <th>Featured</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((proj) => (
                        <tr key={proj.id} className={styles.tableRow}>
                          <td className={styles.tableCell} style={{ fontWeight: '600' }}>{proj.title}</td>
                          <td className={styles.tableCell}>
                            {proj.tags.join(', ')}
                          </td>
                          <td className={styles.tableCell}>{proj.featured ? '⭐️ Yes' : 'No'}</td>
                          <td className={`${styles.tableCell} ${styles.actionCell}`}>
                            <button 
                              onClick={() => setEditingProject(proj)} 
                              className={`${styles.actionBtn} ${styles.editBtn}`}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteProject(proj.id)} 
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {projects.length === 0 && (
                        <tr>
                          <td colSpan={4} className={styles.tableCell} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                            No projects found. Add one to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {editingProject.id ? 'Edit Project' : 'New Project'}
                  </h2>
                  <button onClick={() => setEditingProject(null)} className={styles.logoutBtn}>
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleProjectSave} className={styles.formGrid}>
                  <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Project Title</label>
                      <input
                        type="text"
                        value={editingProject.title || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                        required
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Tags (comma separated)</label>
                      <input
                        type="text"
                        value={Array.isArray(editingProject.tags) ? editingProject.tags.join(', ') : editingProject.tags || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value as any })}
                        placeholder="React, Supabase, CSS"
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Project Description</label>
                    <textarea
                      value={editingProject.description || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      required
                      rows={3}
                      className={styles.formTextarea}
                    />
                  </div>

                  <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>GitHub Repo URL</label>
                      <input
                        type="text"
                        value={editingProject.github_url || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, github_url: e.target.value })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Live Demo URL</label>
                      <input
                        type="text"
                        value={editingProject.live_url || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, live_url: e.target.value })}
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', columnGap: '0.5rem' }}>
                    <input
                      id="featured"
                      type="checkbox"
                      checked={editingProject.featured || false}
                      onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="featured" className={styles.formLabel} style={{ textTransform: 'none', cursor: 'pointer' }}>
                      Feature this project in Hero/Top section
                    </label>
                  </div>

                  <div>
                    <button type="submit" className={styles.saveBtn}>Save Project</button>
                  </div>
                </form>
              </section>
            )}
          </div>
        )}

        {/* ==========================================
           TAB: MANAGE SKILLS
           ========================================== */}
        {activeTab === 'skills' && (
          <div>
            {!editingSkill ? (
              <div>
                <div className={styles.sectionHeader} style={{ marginBlockEnd: 'var(--space-8)' }}>
                  <h2 className={styles.sectionTitle}>Skills by Category</h2>
                  {!showAddCat ? (
                    <button 
                      onClick={() => setShowAddCat(true)} 
                      className={styles.newBtn}
                    >
                      + Add Category
                    </button>
                  ) : (
                    <form onSubmit={handleAddCategorySubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="New Category Name"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        required
                        className={styles.formInput}
                        style={{ padding: '6px 12px', width: '180px' }}
                        autoFocus
                      />
                      <button type="submit" className={styles.newBtn}>
                        Create
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setShowAddCat(false); setNewCatName(''); }}
                        className={styles.logoutBtn}
                        style={{ padding: '6px 12px' }}
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
                
                {(() => {
                  const activeCats = Array.from(new Set(skills.map((s) => s.category))).filter(Boolean);
                  const allCats = Array.from(new Set([...activeCats, ...emptyCategories])).filter(Boolean);
                  const catsToRender = allCats.length > 0 ? allCats : ['Frontend', 'Backend', 'Tools', 'Design'];
                  return catsToRender.map((cat) => {
                  const catSkills = skills.filter((s) => s.category === cat);
                  return (
                    <div key={cat} style={{ marginBlockEnd: 'var(--space-8)' }}>
                      <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle} style={{ fontSize: 'var(--fs-lg)', color: 'var(--color-accent)' }}>
                          {cat} Skills
                        </h3>
                        <button 
                          onClick={() => setEditingSkill({ name: '', category: cat, proficiency: 80 })} 
                          className={styles.newBtn}
                        >
                          + Add {cat} Skill
                        </button>
                      </div>

                      <div className={styles.tableWrapper}>
                        <table className={styles.itemTable}>
                          <thead className={styles.tableHeader}>
                            <tr>
                              <th>Skill Name</th>
                              <th>Proficiency</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catSkills.map((skill) => (
                              <tr key={skill.id} className={styles.tableRow}>
                                <td className={styles.tableCell} style={{ fontWeight: '600', width: '50%' }}>{skill.name}</td>
                                <td className={styles.tableCell} style={{ width: '25%' }}>{getProficiencyLabel(skill.proficiency)}</td>
                                <td className={`${styles.tableCell} ${styles.actionCell}`} style={{ width: '25%' }}>
                                  <button 
                                    onClick={() => setEditingSkill(skill)} 
                                    className={`${styles.actionBtn} ${styles.editBtn}`}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => deleteSkill(skill.id)} 
                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {catSkills.length === 0 && (
                              <tr>
                                <td colSpan={3} className={styles.tableCell} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                                  No {cat.toLowerCase()} skills found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}
              </div>
            ) : (
              <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {editingSkill.id ? 'Edit Skill' : 'New Skill'}
                  </h2>
                  <button onClick={() => setEditingSkill(null)} className={styles.logoutBtn}>
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSkillSave} className={styles.formGrid}>
                  <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Skill Name</label>
                      <input
                        type="text"
                        value={editingSkill.name || ''}
                        onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                        required
                        placeholder="TypeScript"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Category</label>
                      <input
                        type="text"
                        list="categories-list"
                        value={editingSkill.category || ''}
                        onChange={(e) => setEditingSkill({ ...editingSkill, category: e.target.value })}
                        required
                        placeholder="e.g., Frontend, Backend, DevOps"
                        className={styles.formInput}
                      />
                      <datalist id="categories-list">
                        {Array.from(new Set(skills.map((s) => s.category))).filter(Boolean).map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Proficiency Level</label>
                    <select
                      value={mapToClosestValue(editingSkill.proficiency)}
                      onChange={(e) => {
                        setEditingSkill({ ...editingSkill, proficiency: parseInt(e.target.value) });
                      }}
                      required
                      className={styles.formInput}
                      style={{ background: 'var(--bg-app)', color: 'var(--fg-app)' }}
                    >
                      <option value={95}>Expert</option>
                      <option value={85}>Advanced</option>
                      <option value={65}>Intermediate</option>
                      <option value={30}>Beginner</option>
                    </select>
                  </div>

                  <div>
                    <button type="submit" className={styles.saveBtn}>Save Skill</button>
                  </div>
                </form>
              </section>
            )}
          </div>
        )}

        {/* ==========================================
           TAB: VIEW INCOMING MESSAGES
           ========================================== */}
        {activeTab === 'messages' && (
          <section className={styles.messageGrid}>
            <h2 className={styles.sectionTitle} style={{ marginBlockEnd: '1.5rem' }}>Inbox Submissions</h2>
            {messages.map((msg) => (
              <article key={msg.id} className={styles.messageCard}>
                <div className={styles.messageHeader}>
                  <div className={styles.messageSender}>
                    <span className={styles.senderName}>{msg.name}</span>
                    <a href={`mailto:${msg.email}`} className={styles.senderEmail}>
                      {msg.email}
                    </a>
                  </div>
                  <span className={styles.messageDate}>
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                
                <p className={styles.messageBody}>{msg.message}</p>
                
                <div className={styles.messageActions}>
                  <button 
                    onClick={() => deleteMessage(msg.id)}
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  >
                    Delete Message
                  </button>
                </div>
              </article>
            ))}
            {messages.length === 0 && (
              <div className={styles.alert} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                Your inbox is currently empty.
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
