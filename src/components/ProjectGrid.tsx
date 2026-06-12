'use client';

import { useState, useMemo, useEffect } from 'react';
import { Project } from '@/lib/supabase';
import styles from '@/app/page.module.css';

interface ProjectGridProps {
  initialProjects: Project[];
}

function parseGitHubUrl(url: string) {
  try {
    const cleanUrl = url.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '');
    const parts = cleanUrl.split('/');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return { owner: parts[0], repo: parts[1].split(/[#?]/)[0] };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export default function ProjectGrid({ initialProjects }: ProjectGridProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [ghStats, setGhStats] = useState<Record<string, { stars: number; forks: number }>>({});

  // Parse and fetch GitHub stats for all projects that have a GitHub URL
  useEffect(() => {
    initialProjects.forEach(async (project) => {
      if (!project.github_url) return;
      const parsed = parseGitHubUrl(project.github_url);
      if (!parsed) return;
      try {
        const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
        if (res.ok) {
          const data = await res.json();
          setGhStats((prev) => ({
            ...prev,
            [project.id]: {
              stars: data.stargazers_count,
              forks: data.forks_count
            }
          }));
        }
      } catch (e) {
        console.warn(`Failed to fetch GitHub stats for ${project.title}:`, e);
      }
    });
  }, [initialProjects]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    initialProjects.forEach((p) => {
      p.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [initialProjects]);

  // Filter projects based on search text and selected tag
  const filteredProjects = useMemo(() => {
    return initialProjects.filter((project) => {
      const matchesSearch = 
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase());
      
      const matchesTag = !selectedTag || project.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [initialProjects, search, selectedTag]);

  return (
    <div className={styles.projectSectionWrapper}>
      <div className={styles.filterBar}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            aria-label="Search projects"
          />
        </div>
        
        <div className={styles.tagFilters}>
          <button
            onClick={() => setSelectedTag(null)}
            className={`${styles.tagButton} ${!selectedTag ? styles.tagButtonActive : ''}`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`${styles.tagButton} ${selectedTag === tag ? styles.tagButtonActive : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.projectGrid}>
        {filteredProjects.map((project) => (
          <article key={project.id} className={styles.projectCard}>
            <div className={styles.projectHeader}>
              <div className={styles.projectGlow} />
              <h3 className={styles.projectTitle}>{project.title}</h3>
            </div>
            
            <p className={styles.projectDescription}>{project.description}</p>
            
            <div className={styles.cardTags}>
              {project.tags.map((tag) => (
                <span key={tag} className={styles.cardTag}>
                  {tag}
                </span>
              ))}
            </div>
            
            <div className={styles.projectLinks}>
              {project.github_url && (
                <a 
                  href={project.github_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.projectLink}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginInlineEnd: '2px' }}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                    GitHub
                  </span>
                  {ghStats[project.id] !== undefined && (
                    <span className={styles.projectLinkStat}>
                      ⭐{ghStats[project.id].stars} · 🍴{ghStats[project.id].forks}
                    </span>
                  )}
                </a>
              )}
              {project.live_url && (
                <a 
                  href={project.live_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${styles.projectLink} ${styles.projectLinkPrimary}`}
                >
                  Live Demo
                </a>
              )}
            </div>
          </article>
        ))}

        {filteredProjects.length === 0 && (
          <div className={styles.noProjects}>
            <p>No projects match your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
