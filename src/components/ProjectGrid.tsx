'use client';

import { useState, useMemo } from 'react';
import { Project } from '@/lib/supabase';
import styles from '@/app/page.module.css';

interface ProjectGridProps {
  initialProjects: Project[];
}

export default function ProjectGrid({ initialProjects }: ProjectGridProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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
                  GitHub
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
