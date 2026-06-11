'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  supabase, 
  isSupabaseConfigured, 
  Profile, 
  Project, 
  Skill,
  Education,
  Achievement,
  Certification
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
  const [activeTab, setActiveTab] = useState<'profile' | 'projects' | 'skills' | 'education' | 'achievements' | 'certifications' | 'messages'>('profile');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Core Data States
  const [profile, setProfile] = useState<Profile>({ name: '', role: '', bio: '' });
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // CRUD Editing States
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);
  const [editingEducation, setEditingEducation] = useState<Partial<Education> | null>(null);
  const [editingAchievement, setEditingAchievement] = useState<Partial<Achievement> | null>(null);
  const [editingCertification, setEditingCertification] = useState<Partial<Certification> | null>(null);

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

      // Fetch Education
      const { data: eduData } = await supabase.from('education').select('*').order('sort_order', { ascending: true });
      if (eduData) setEducation(eduData);

      // Fetch Achievements
      const { data: achData } = await supabase.from('achievements').select('*').order('sort_order', { ascending: true });
      if (achData) setAchievements(achData);

      // Fetch Certifications
      const { data: certData } = await supabase.from('certifications').select('*').order('sort_order', { ascending: true });
      if (certData) setCertifications(certData);

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
      resume_url: '/resume.pdf',
      resume_preview_url: 'https://lh3.googleusercontent.com/d/1fb_IkGGlT3euNspgsCnFmy75RP5k9X4Y',
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
    if (!cachedProfile.resume_url) {
      cachedProfile.resume_url = '/resume.pdf';
      needsUpdate = true;
    }
    if (!cachedProfile.resume_preview_url) {
      cachedProfile.resume_preview_url = 'https://lh3.googleusercontent.com/d/1fb_IkGGlT3euNspgsCnFmy75RP5k9X4Y';
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

    setEducation(getOrInit('portfolio_mock_education', [
      {
        id: '1',
        institution: 'New York University',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        start_date: '2023',
        end_date: '2027',
        gpa: '3.9 / 4.0',
        description: 'Focused on Software Engineering, Databases, and Web Development. Active member of the NYU Computer Science Club.',
        sort_order: 1
      }
    ]));

    setAchievements(getOrInit('portfolio_mock_achievements', [
      {
        id: '1',
        title: '1st Place - NYU Hackathon',
        awarder: 'NYU Tech Club',
        date: 'Oct 2025',
        description: 'Built a real-time smart recycling tracker using Next.js and Supabase, competing against 50+ teams.',
        sort_order: 1
      },
      {
        id: '2',
        title: 'Dean\'s List',
        awarder: 'NYU Department of Computer Science',
        date: 'June 2025',
        description: 'Recognized for maintaining a GPA of 3.85 or higher during the academic year.',
        sort_order: 2
      }
    ]));

    setCertifications(getOrInit('portfolio_mock_certifications', [
      {
        id: '1',
        name: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        date: 'Jan 2026',
        credential_url: 'https://aws.amazon.com',
        sort_order: 1
      },
      {
        id: '2',
        name: 'Google Cloud Digital Leader',
        issuer: 'Google Cloud',
        date: 'Nov 2025',
        credential_url: 'https://cloud.google.com',
        sort_order: 2
      }
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
        resume_preview_url: profile.resume_preview_url,
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
  // EDUCATION CRUD ACTION HANDLERS
  // ==========================================
  const handleEducationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEducation?.institution || !editingEducation.degree || !editingEducation.field_of_study) {
      showStatus('error', 'Institution, degree, and field of study are required.');
      return;
    }

    const eduData = {
      ...editingEducation,
      sort_order: editingEducation.sort_order || 0,
    };

    if (isDemo) {
      let updated;
      if (eduData.id) {
        updated = education.map((e) => e.id === eduData.id ? (eduData as Education) : e);
      } else {
        const newEdu = { ...eduData, id: Date.now().toString() } as Education;
        updated = [...education, newEdu];
      }
      setEducation(updated);
      localStorage.setItem('portfolio_mock_education', JSON.stringify(updated));
      setEditingEducation(null);
      showStatus('success', 'Demo education saved!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('education').upsert([
        {
          id: eduData.id || undefined,
          institution: eduData.institution,
          degree: eduData.degree,
          field_of_study: eduData.field_of_study,
          start_date: eduData.start_date || '',
          end_date: eduData.end_date || '',
          gpa: eduData.gpa,
          description: eduData.description,
          sort_order: eduData.sort_order
        }
      ]);

      if (error) {
        showStatus('error', `Error: ${error.message}`);
      } else {
        showStatus('success', 'Education saved to Supabase!');
        setEditingEducation(null);
        loadSupabaseData();
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to save education.');
    }
  };

  const deleteEducation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education record?')) return;

    if (isDemo) {
      const updated = education.filter((e) => e.id !== id);
      setEducation(updated);
      localStorage.setItem('portfolio_mock_education', JSON.stringify(updated));
      showStatus('success', 'Demo education deleted!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('education').delete().eq('id', id);
      if (error) {
        showStatus('error', `Delete failed: ${error.message}`);
      } else {
        showStatus('success', 'Education record deleted!');
        loadSupabaseData();
      }
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  // ==========================================
  // ACHIEVEMENTS CRUD ACTION HANDLERS
  // ==========================================
  const handleAchievementSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAchievement?.title || !editingAchievement.awarder || !editingAchievement.date) {
      showStatus('error', 'Title, awarder, and date are required.');
      return;
    }

    const achData = {
      ...editingAchievement,
      sort_order: editingAchievement.sort_order || 0,
    };

    if (isDemo) {
      let updated;
      if (achData.id) {
        updated = achievements.map((a) => a.id === achData.id ? (achData as Achievement) : a);
      } else {
        const newAch = { ...achData, id: Date.now().toString() } as Achievement;
        updated = [...achievements, newAch];
      }
      setAchievements(updated);
      localStorage.setItem('portfolio_mock_achievements', JSON.stringify(updated));
      setEditingAchievement(null);
      showStatus('success', 'Demo achievement saved!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('achievements').upsert([
        {
          id: achData.id || undefined,
          title: achData.title,
          awarder: achData.awarder,
          date: achData.date,
          description: achData.description,
          sort_order: achData.sort_order
        }
      ]);

      if (error) {
        showStatus('error', `Error: ${error.message}`);
      } else {
        showStatus('success', 'Achievement saved to Supabase!');
        setEditingAchievement(null);
        loadSupabaseData();
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to save achievement.');
    }
  };

  const deleteAchievement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this achievement record?')) return;

    if (isDemo) {
      const updated = achievements.filter((a) => a.id !== id);
      setAchievements(updated);
      localStorage.setItem('portfolio_mock_achievements', JSON.stringify(updated));
      showStatus('success', 'Demo achievement deleted!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('achievements').delete().eq('id', id);
      if (error) {
        showStatus('error', `Delete failed: ${error.message}`);
      } else {
        showStatus('success', 'Achievement record deleted!');
        loadSupabaseData();
      }
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  // ==========================================
  // CERTIFICATIONS CRUD ACTION HANDLERS
  // ==========================================
  const handleCertificationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCertification?.name || !editingCertification.issuer || !editingCertification.date) {
      showStatus('error', 'Name, issuer, and date are required.');
      return;
    }

    const certData = {
      ...editingCertification,
      sort_order: editingCertification.sort_order || 0,
    };

    if (isDemo) {
      let updated;
      if (certData.id) {
        updated = certifications.map((c) => c.id === certData.id ? (certData as Certification) : c);
      } else {
        const newCert = { ...certData, id: Date.now().toString() } as Certification;
        updated = [...certifications, newCert];
      }
      setCertifications(updated);
      localStorage.setItem('portfolio_mock_certifications', JSON.stringify(updated));
      setEditingCertification(null);
      showStatus('success', 'Demo certification saved!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('certifications').upsert([
        {
          id: certData.id || undefined,
          name: certData.name,
          issuer: certData.issuer,
          date: certData.date,
          credential_url: certData.credential_url,
          sort_order: certData.sort_order
        }
      ]);

      if (error) {
        showStatus('error', `Error: ${error.message}`);
      } else {
        showStatus('success', 'Certification saved to Supabase!');
        setEditingCertification(null);
        loadSupabaseData();
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to save certification.');
    }
  };

  const deleteCertification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification record?')) return;

    if (isDemo) {
      const updated = certifications.filter((c) => c.id !== id);
      setCertifications(updated);
      localStorage.setItem('portfolio_mock_certifications', JSON.stringify(updated));
      showStatus('success', 'Demo certification deleted!');
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase.from('certifications').delete().eq('id', id);
      if (error) {
        showStatus('error', `Delete failed: ${error.message}`);
      } else {
        showStatus('success', 'Certification record deleted!');
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
          resume_preview_url: p.resume_preview_url,
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

      // 5. Sync Education
      const localEducation = localStorage.getItem('portfolio_mock_education');
      if (localEducation) {
        const eduList = JSON.parse(localEducation) as Education[];
        const { error: clearEduError } = await supabase.from('education').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (clearEduError) throw new Error(`Failed to clear education: ${clearEduError.message}`);

        for (const e of eduList) {
          const eduToUpsert = {
            institution: e.institution,
            degree: e.degree,
            field_of_study: e.field_of_study,
            start_date: e.start_date,
            end_date: e.end_date,
            gpa: e.gpa,
            description: e.description,
            sort_order: e.sort_order || 0
          };
          const { error: eduError } = await supabase.from('education').insert(eduToUpsert);
          if (eduError) throw new Error(`Education "${e.institution}" sync failed: ${eduError.message}`);
        }
      }

      // 6. Sync Achievements
      const localAchievements = localStorage.getItem('portfolio_mock_achievements');
      if (localAchievements) {
        const achList = JSON.parse(localAchievements) as Achievement[];
        const { error: clearAchError } = await supabase.from('achievements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (clearAchError) throw new Error(`Failed to clear achievements: ${clearAchError.message}`);

        for (const a of achList) {
          const achToUpsert = {
            title: a.title,
            awarder: a.awarder,
            date: a.date,
            description: a.description,
            sort_order: a.sort_order || 0
          };
          const { error: achError } = await supabase.from('achievements').insert(achToUpsert);
          if (achError) throw new Error(`Achievement "${a.title}" sync failed: ${achError.message}`);
        }
      }

      // 7. Sync Certifications
      const localCertifications = localStorage.getItem('portfolio_mock_certifications');
      if (localCertifications) {
        const certList = JSON.parse(localCertifications) as Certification[];
        const { error: clearCertError } = await supabase.from('certifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (clearCertError) throw new Error(`Failed to clear certifications: ${clearCertError.message}`);

        for (const c of certList) {
          const certToUpsert = {
            name: c.name,
            issuer: c.issuer,
            date: c.date,
            credential_url: c.credential_url,
            sort_order: c.sort_order || 0
          };
          const { error: certError } = await supabase.from('certifications').insert(certToUpsert);
          if (certError) throw new Error(`Certification "${c.name}" sync failed: ${certError.message}`);
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
          onClick={() => { setActiveTab('profile'); setEditingProject(null); setEditingSkill(null); setEditingEducation(null); setEditingAchievement(null); setEditingCertification(null); }} 
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
        >
          Profile details
        </button>
        <button 
          onClick={() => { setActiveTab('projects'); setEditingProject(null); setEditingSkill(null); setEditingEducation(null); setEditingAchievement(null); setEditingCertification(null); }} 
          className={`${styles.tabBtn} ${activeTab === 'projects' ? styles.tabBtnActive : ''}`}
        >
          Manage Projects
        </button>
        <button 
          onClick={() => { setActiveTab('skills'); setEditingProject(null); setEditingSkill(null); setEditingEducation(null); setEditingAchievement(null); setEditingCertification(null); }} 
          className={`${styles.tabBtn} ${activeTab === 'skills' ? styles.tabBtnActive : ''}`}
        >
          Manage Skills
        </button>
        <button 
          onClick={() => { setActiveTab('education'); setEditingProject(null); setEditingSkill(null); setEditingEducation(null); setEditingAchievement(null); setEditingCertification(null); }} 
          className={`${styles.tabBtn} ${activeTab === 'education' ? styles.tabBtnActive : ''}`}
        >
          Manage Education
        </button>
        <button 
          onClick={() => { setActiveTab('achievements'); setEditingProject(null); setEditingSkill(null); setEditingEducation(null); setEditingAchievement(null); setEditingCertification(null); }} 
          className={`${styles.tabBtn} ${activeTab === 'achievements' ? styles.tabBtnActive : ''}`}
        >
          Manage Achievements
        </button>
        <button 
          onClick={() => { setActiveTab('certifications'); setEditingProject(null); setEditingSkill(null); setEditingEducation(null); setEditingAchievement(null); setEditingCertification(null); }} 
          className={`${styles.tabBtn} ${activeTab === 'certifications' ? styles.tabBtnActive : ''}`}
        >
          Manage Certifications
        </button>
        <button 
          onClick={() => { setActiveTab('messages'); setEditingProject(null); setEditingSkill(null); setEditingEducation(null); setEditingAchievement(null); setEditingCertification(null); }} 
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

              <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
              </div>

              <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(2, 1fr)', marginBlockStart: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Resume PDF URL</label>
                  <input
                    type="text"
                    value={profile.resume_url || ''}
                    onChange={(e) => setProfile({ ...profile, resume_url: e.target.value })}
                    className={styles.formInput}
                    placeholder="e.g. /resume.pdf"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Resume Preview Image URL</label>
                  <input
                    type="text"
                    value={profile.resume_preview_url || ''}
                    onChange={(e) => setProfile({ ...profile, resume_preview_url: e.target.value })}
                    className={styles.formInput}
                    placeholder="e.g. https://lh3.googleusercontent.com/d/..."
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
           TAB: MANAGE EDUCATION
           ========================================== */}
        {activeTab === 'education' && (
          <div>
            {!editingEducation ? (
              <div>
                <div className={styles.sectionHeader} style={{ marginBlockEnd: 'var(--space-8)' }}>
                  <h2 className={styles.sectionTitle}>Education History</h2>
                  <button 
                    onClick={() => setEditingEducation({ institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', gpa: '', description: '', sort_order: (education.length + 1) })} 
                    className={styles.newBtn}
                  >
                    + Add Education
                  </button>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.itemTable}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th>Institution</th>
                        <th>Degree / Field</th>
                        <th>Period</th>
                        <th>GPA</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {education.map((edu) => (
                        <tr key={edu.id} className={styles.tableRow}>
                          <td className={styles.tableCell} style={{ fontWeight: '600', width: '30%' }}>{edu.institution}</td>
                          <td className={styles.tableCell} style={{ width: '30%' }}>{edu.degree} in {edu.field_of_study}</td>
                          <td className={styles.tableCell} style={{ width: '20%' }}>{edu.start_date} - {edu.end_date}</td>
                          <td className={styles.tableCell} style={{ width: '10%' }}>{edu.gpa || 'N/A'}</td>
                          <td className={`${styles.tableCell} ${styles.actionCell}`} style={{ width: '10%' }}>
                            <button 
                              onClick={() => setEditingEducation(edu)} 
                              className={`${styles.actionBtn} ${styles.editBtn}`}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteEducation(edu.id)} 
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {education.length === 0 && (
                        <tr>
                          <td colSpan={5} className={styles.tableCell} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                            No education records found.
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
                    {editingEducation.id ? 'Edit Education Record' : 'New Education Record'}
                  </h2>
                  <button onClick={() => setEditingEducation(null)} className={styles.logoutBtn}>
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleEducationSave} className={styles.formGrid}>
                  <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Institution Name</label>
                      <input
                        type="text"
                        value={editingEducation.institution || ''}
                        onChange={(e) => setEditingEducation({ ...editingEducation, institution: e.target.value })}
                        required
                        placeholder="e.g. New York University"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Degree</label>
                      <input
                        type="text"
                        value={editingEducation.degree || ''}
                        onChange={(e) => setEditingEducation({ ...editingEducation, degree: e.target.value })}
                        required
                        placeholder="e.g. Bachelor of Science"
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Field of Study</label>
                      <input
                        type="text"
                        value={editingEducation.field_of_study || ''}
                        onChange={(e) => setEditingEducation({ ...editingEducation, field_of_study: e.target.value })}
                        required
                        placeholder="e.g. Computer Science"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>GPA</label>
                      <input
                        type="text"
                        value={editingEducation.gpa || ''}
                        onChange={(e) => setEditingEducation({ ...editingEducation, gpa: e.target.value })}
                        placeholder="e.g. 3.9 / 4.0"
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Start Date / Year</label>
                      <input
                        type="text"
                        value={editingEducation.start_date || ''}
                        onChange={(e) => setEditingEducation({ ...editingEducation, start_date: e.target.value })}
                        required
                        placeholder="e.g. 2023"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>End Date / Year (or "Present")</label>
                      <input
                        type="text"
                        value={editingEducation.end_date || ''}
                        onChange={(e) => setEditingEducation({ ...editingEducation, end_date: e.target.value })}
                        required
                        placeholder="e.g. 2027 or Present"
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Description</label>
                    <textarea
                      value={editingEducation.description || ''}
                      onChange={(e) => setEditingEducation({ ...editingEducation, description: e.target.value })}
                      placeholder="Specializations, courses, or highlights..."
                      rows={3}
                      className={styles.formTextarea}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Sort Order</label>
                    <input
                      type="number"
                      value={editingEducation.sort_order !== undefined ? editingEducation.sort_order : 0}
                      onChange={(e) => setEditingEducation({ ...editingEducation, sort_order: parseInt(e.target.value) || 0 })}
                      required
                      className={styles.formInput}
                    />
                  </div>

                  <div>
                    <button type="submit" className={styles.saveBtn}>Save Education</button>
                  </div>
                </form>
              </section>
            )}
          </div>
        )}

        {/* ==========================================
           TAB: MANAGE ACHIEVEMENTS
           ========================================== */}
        {activeTab === 'achievements' && (
          <div>
            {!editingAchievement ? (
              <div>
                <div className={styles.sectionHeader} style={{ marginBlockEnd: 'var(--space-8)' }}>
                  <h2 className={styles.sectionTitle}>Achievements & Awards</h2>
                  <button 
                    onClick={() => setEditingAchievement({ title: '', awarder: '', date: '', description: '', sort_order: (achievements.length + 1) })} 
                    className={styles.newBtn}
                  >
                    + Add Achievement
                  </button>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.itemTable}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th>Title</th>
                        <th>Awarder</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {achievements.map((ach) => (
                        <tr key={ach.id} className={styles.tableRow}>
                          <td className={styles.tableCell} style={{ fontWeight: '600', width: '40%' }}>{ach.title}</td>
                          <td className={styles.tableCell} style={{ width: '30%' }}>{ach.awarder}</td>
                          <td className={styles.tableCell} style={{ width: '20%' }}>{ach.date}</td>
                          <td className={`${styles.tableCell} ${styles.actionCell}`} style={{ width: '10%' }}>
                            <button 
                              onClick={() => setEditingAchievement(ach)} 
                              className={`${styles.actionBtn} ${styles.editBtn}`}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteAchievement(ach.id)} 
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {achievements.length === 0 && (
                        <tr>
                          <td colSpan={4} className={styles.tableCell} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                            No achievement records found.
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
                    {editingAchievement.id ? 'Edit Achievement' : 'New Achievement'}
                  </h2>
                  <button onClick={() => setEditingAchievement(null)} className={styles.logoutBtn}>
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleAchievementSave} className={styles.formGrid}>
                  <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Achievement Title</label>
                      <input
                        type="text"
                        value={editingAchievement.title || ''}
                        onChange={(e) => setEditingAchievement({ ...editingAchievement, title: e.target.value })}
                        required
                        placeholder="e.g. 1st Place - NYU Hackathon"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Awarder / Issuer</label>
                      <input
                        type="text"
                        value={editingAchievement.awarder || ''}
                        onChange={(e) => setEditingAchievement({ ...editingAchievement, awarder: e.target.value })}
                        required
                        placeholder="e.g. NYU Tech Club"
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Date</label>
                      <input
                        type="text"
                        value={editingAchievement.date || ''}
                        onChange={(e) => setEditingAchievement({ ...editingAchievement, date: e.target.value })}
                        required
                        placeholder="e.g. Oct 2025"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Sort Order</label>
                      <input
                        type="number"
                        value={editingAchievement.sort_order !== undefined ? editingAchievement.sort_order : 0}
                        onChange={(e) => setEditingAchievement({ ...editingAchievement, sort_order: parseInt(e.target.value) || 0 })}
                        required
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Description</label>
                    <textarea
                      value={editingAchievement.description || ''}
                      onChange={(e) => setEditingAchievement({ ...editingAchievement, description: e.target.value })}
                      placeholder="Detail of the achievement, score, project details..."
                      rows={3}
                      className={styles.formTextarea}
                    />
                  </div>

                  <div>
                    <button type="submit" className={styles.saveBtn}>Save Achievement</button>
                  </div>
                </form>
              </section>
            )}
          </div>
        )}

        {/* ==========================================
           TAB: MANAGE CERTIFICATIONS
           ========================================== */}
        {activeTab === 'certifications' && (
          <div>
            {!editingCertification ? (
              <div>
                <div className={styles.sectionHeader} style={{ marginBlockEnd: 'var(--space-8)' }}>
                  <h2 className={styles.sectionTitle}>Certifications</h2>
                  <button 
                    onClick={() => setEditingCertification({ name: '', issuer: '', date: '', credential_url: '', sort_order: (certifications.length + 1) })} 
                    className={styles.newBtn}
                  >
                    + Add Certification
                  </button>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.itemTable}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th>Name</th>
                        <th>Issuer</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certifications.map((cert) => (
                        <tr key={cert.id} className={styles.tableRow}>
                          <td className={styles.tableCell} style={{ fontWeight: '600', width: '40%' }}>{cert.name}</td>
                          <td className={styles.tableCell} style={{ width: '30%' }}>{cert.issuer}</td>
                          <td className={styles.tableCell} style={{ width: '20%' }}>{cert.date}</td>
                          <td className={`${styles.tableCell} ${styles.actionCell}`} style={{ width: '10%' }}>
                            <button 
                              onClick={() => setEditingCertification(cert)} 
                              className={`${styles.actionBtn} ${styles.editBtn}`}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteCertification(cert.id)} 
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {certifications.length === 0 && (
                        <tr>
                          <td colSpan={4} className={styles.tableCell} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                            No certifications found.
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
                    {editingCertification.id ? 'Edit Certification' : 'New Certification'}
                  </h2>
                  <button onClick={() => setEditingCertification(null)} className={styles.logoutBtn}>
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCertificationSave} className={styles.formGrid}>
                  <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Certification Name</label>
                      <input
                        type="text"
                        value={editingCertification.name || ''}
                        onChange={(e) => setEditingCertification({ ...editingCertification, name: e.target.value })}
                        required
                        placeholder="e.g. AWS Certified Cloud Practitioner"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Issuer</label>
                      <input
                        type="text"
                        value={editingCertification.issuer || ''}
                        onChange={(e) => setEditingCertification({ ...editingCertification, issuer: e.target.value })}
                        required
                        placeholder="e.g. Amazon Web Services"
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.formGridTwoCol} style={{ display: 'grid', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Date Issued</label>
                      <input
                        type="text"
                        value={editingCertification.date || ''}
                        onChange={(e) => setEditingCertification({ ...editingCertification, date: e.target.value })}
                        required
                        placeholder="e.g. Jan 2026"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Sort Order</label>
                      <input
                        type="number"
                        value={editingCertification.sort_order !== undefined ? editingCertification.sort_order : 0}
                        onChange={(e) => setEditingCertification({ ...editingCertification, sort_order: parseInt(e.target.value) || 0 })}
                        required
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Credential URL</label>
                    <input
                      type="text"
                      value={editingCertification.credential_url || ''}
                      onChange={(e) => setEditingCertification({ ...editingCertification, credential_url: e.target.value })}
                      placeholder="e.g. https://aws.amazon.com/verify/12345"
                      className={styles.formInput}
                    />
                  </div>

                  <div>
                    <button type="submit" className={styles.saveBtn}>Save Certification</button>
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
