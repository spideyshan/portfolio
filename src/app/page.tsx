import { getProfile, getProjects, getSkills, getEducation, getAchievements, getCertifications } from '@/lib/supabase';
import ProjectGrid from '@/components/ProjectGrid';
import ContactForm from '@/components/ContactForm';
import Header from '@/components/Header';
import AIChat from '@/components/AIChat';
import ScrollEffects from '@/components/ScrollEffects';
import CustomCursor from '@/components/CustomCursor';
import InteractiveBackground from '@/components/InteractiveBackground';
import styles from './page.module.css';

export const revalidate = 60; // Revalidate cache every 60 seconds

const getProficiencyLabel = (pct: number): string => {
  if (pct <= 40) return 'Beginner';
  if (pct <= 75) return 'Intermediate';
  if (pct <= 90) return 'Advanced';
  return 'Expert';
};

const getCleanImageUrl = (url: string | null | undefined, defaultUrl: string): string => {
  if (!url) return defaultUrl;
  const driveMatch = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|lh3\.googleusercontent\.com\/d\/|drive\.google\.com\/thumbnail\?id=)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return url;
};

export default async function Home() {
  // Fetch data concurrently on the server
  const [profile, projects, skills, education, achievements, certifications] = await Promise.all([
    getProfile(),
    getProjects(),
    getSkills(),
    getEducation(),
    getAchievements(),
    getCertifications(),
  ]);

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <>
      <ScrollEffects />
      <CustomCursor />
      <InteractiveBackground />
      {/* Navigation Header */}
      <Header resumeUrl={profile.resume_url} />

      <div className={styles.container}>
        <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroSubtitle}>Hello, I&apos;m</span>
            <h1 className={styles.heroTitle}>
              <span className="text-gradient">{profile.name}</span>
            </h1>
            <p className={styles.heroRole}>{profile.role || 'Computer Science Student | Python Developer'}</p>
            <p className={styles.heroBio}>
              Building secure, scalable, and modern full-stack web applications with Next.js, Python, and Supabase.
            </p>
            <div className={styles.heroButtons}>
              {profile.resume_url && profile.resume_url !== '#' && (
                <a 
                  href={profile.resume_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ gap: '0.5rem' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  View Resume
                </a>
              )}
              <a href="#contact" className={`${styles.btn} ${styles.btnSecondary}`}>
                Contact Me
              </a>
            </div>
          </div>
          
          <div className={styles.heroVisual}>
            <div className={styles.heroArt}>
              <img
                src={getCleanImageUrl(profile.avatar_url, 'https://lh3.googleusercontent.com/d/1TVZ-Oen9krePPrwk8dO3L_JroPKSMsWz')}
                alt={profile.name}
                className={styles.heroAvatar}
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Introduction</span>
            <h2 className={styles.sectionTitle}>About Me</h2>
          </div>
          
          <div className={styles.aboutGrid}>
            <div className={styles.aboutProfile}>
              <div className={styles.avatarContainer}>
                {/* Fallback avatar if no URL is provided */}
                <img
                  src={getCleanImageUrl(profile.avatar_url_about || profile.avatar_url, 'https://lh3.googleusercontent.com/d/1KovBCy_E1whsaxKAVIrH-AWKgNQ2GkFL')}
                  alt={profile.name}
                  className={styles.avatar}
                />
              </div>
              <h3 className={styles.profileName}>{profile.name}</h3>
              <p className={styles.profileRole}>{profile.role}</p>
              
              <div className={styles.socialLinks}>
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="GitHub">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                  </a>
                )}
                {profile.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Twitter">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                  </a>
                )}
              </div>

              {profile.resume_url && profile.resume_url !== '#' && (
                <div style={{ marginBlockStart: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  <a 
                    href={profile.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    style={{ gap: '0.5rem', padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--fs-xs)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download Resume
                  </a>
                </div>
              )}
            </div>
            
            <div className={styles.aboutText}>
              <p>{profile.bio}</p>
              
              <div className={styles.statGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>9.0</div>
                  <div className={styles.statLabel}>Cumulative GPA</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>5</div>
                  <div className={styles.statLabel}>Projects Built</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>3+</div>
                  <div className={styles.statLabel}>Hackathons</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Expertise</span>
            <h2 className={styles.sectionTitle}>Tech Stack</h2>
          </div>
          
          <div className={styles.skillsContainer}>
            {Object.entries(skillsByCategory).map(([category, catSkills]) => (
              <div key={category} className={styles.skillsGroup}>
                <h3 className={styles.groupTitle}>{category}</h3>
                <div className={styles.skillsList}>
                  {catSkills.map((skill) => (
                    <div key={skill.id} className={styles.skillItem}>
                      <div className={styles.skillHeader}>
                        <span className={styles.skillName}>{skill.name}</span>
                        <span className={styles.skillProficiency}>{getProficiencyLabel(skill.proficiency)}</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill} 
                          style={{ width: `${skill.proficiency}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>My Works</span>
            <h2 className={styles.sectionTitle}>Featured Projects</h2>
          </div>
          
          <ProjectGrid initialProjects={projects} />
        </section>

        {/* Education Section */}
        <section id="education" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Academic History</span>
            <h2 className={styles.sectionTitle}>Education</h2>
          </div>
          
          <div className={styles.educationTimeline}>
            {education.map((edu) => (
              <div key={edu.id} className={styles.educationCard}>
                <div className={styles.educationHeader}>
                  <div className={styles.educationMain}>
                    <h3 className={styles.institutionName}>{edu.institution}</h3>
                    <p className={styles.degreeName}>
                      {edu.degree} in {edu.field_of_study}
                    </p>
                  </div>
                  <div className={styles.educationMeta}>
                    <span className={styles.educationPeriod}>
                      {edu.start_date} — {edu.end_date}
                    </span>
                    {edu.gpa && (
                      <span className={styles.educationGpa}>
                        GPA: {edu.gpa}
                      </span>
                    )}
                  </div>
                </div>
                {edu.description && (
                  <p className={styles.educationDescription}>{edu.description}</p>
                )}
              </div>
            ))}
            {education.length === 0 && (
              <p className={styles.noDataText}>No education history added yet.</p>
            )}
          </div>
        </section>

        {/* Achievements Section */}
        <section id="achievements" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Highlights & Awards</span>
            <h2 className={styles.sectionTitle}>Achievements</h2>
          </div>
          
          <div className={styles.achievementsGrid}>
            {achievements.map((ach) => (
              <div key={ach.id} className={styles.achievementCard}>
                <div className={styles.achievementIconContainer}>
                  <span className={styles.achievementIcon}>🏆</span>
                </div>
                <div className={styles.achievementContent}>
                  <h3 className={styles.achievementTitle}>{ach.title}</h3>
                  <div className={styles.achievementMeta}>
                    <span className={styles.achievementAwarder}>{ach.awarder}</span>
                    <span className={styles.achievementDate}>{ach.date}</span>
                  </div>
                  {ach.description && (
                    <p className={styles.achievementDescription}>{ach.description}</p>
                  )}
                </div>
              </div>
            ))}
            {achievements.length === 0 && (
              <p className={styles.noDataText}>No achievements added yet.</p>
            )}
          </div>
        </section>

        {/* Certifications Section */}
        <section id="certifications" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Professional Qualifications</span>
            <h2 className={styles.sectionTitle}>Certifications</h2>
          </div>
          
          <div className={styles.certificationsGrid}>
            {certifications.map((cert) => (
              <div key={cert.id} className={styles.certificationCard}>
                <div className={styles.certIconContainer}>
                  <span className={styles.certIcon}>📜</span>
                </div>
                <div className={styles.certContent}>
                  <h3 className={styles.certName}>{cert.name}</h3>
                  <p className={styles.certIssuer}>{cert.issuer}</p>
                  <span className={styles.certDate}>{cert.date}</span>
                  {cert.credential_url && (
                    <a 
                      href={cert.credential_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.certLink}
                    >
                      View Credential ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
            {certifications.length === 0 && (
              <p className={styles.noDataText}>No certifications added yet.</p>
            )}
          </div>
        </section>

        {/* Resume Section */}
        {profile.resume_url && profile.resume_url !== '#' && (
          <section id="resume" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Resume / CV</span>
              <h2 className={styles.sectionTitle}>My Resume</h2>
            </div>
            
            <div className={styles.resumeContainer}>
              <div className={styles.resumeContent}>
                <h3 className={styles.resumeTitle}>Download my print-ready PDF resume</h3>
                <p className={styles.resumeText}>
                  Get a comprehensive overview of my technical expertise, project achievements, and educational qualifications formatted for recruiter tracking systems.
                </p>
                <div className={styles.resumeBenefits}>
                  <div className={styles.resumeBenefit}>
                    <span className={styles.benefitIcon}>✓</span>
                    <span>Single-page, ATS-optimized layout</span>
                  </div>
                  <div className={styles.resumeBenefit}>
                    <span className={styles.benefitIcon}>✓</span>
                    <span>Includes contact, core skills, and live project links</span>
                  </div>
                  <div className={styles.resumeBenefit}>
                    <span className={styles.benefitIcon}>✓</span>
                    <span>Clean styling for offline printing or reading</span>
                  </div>
                </div>
                <a 
                  href={profile.resume_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`${styles.btn} ${styles.btnPrimary} ${styles.resumeDownloadBtn}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginInlineEnd: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download PDF Resume
                </a>
              </div>

              <a 
                href={profile.resume_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.resumeVisualPreview}
              >
                <div className={styles.resumeImageWrapper}>
                  <img 
                    src={getCleanImageUrl(profile.resume_preview_url, 'https://lh3.googleusercontent.com/d/1fb_IkGGlT3euNspgsCnFmy75RP5k9X4Y')} 
                    alt={`${profile.name}'s Resume Preview`} 
                    className={styles.resumePreviewImg} 
                  />
                  <div className={styles.resumePreviewOverlay}>
                    <span className={styles.resumePreviewZoomIcon}>🔍 View Full PDF</span>
                  </div>
                </div>
              </a>
            </div>
          </section>
        )}

        {/* Contact Section */}
        <section id="contact" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Get in touch</span>
            <h2 className={styles.sectionTitle}>Contact Me</h2>
          </div>
          
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <h3 className={styles.contactHeading}>Let&apos;s talk about your project</h3>
              <p className={styles.contactText}>
                Feel free to reach out if you have a project idea, want to collaborate, or just want to chat about web technology!
              </p>
              
              <div className={styles.contactDetails}>
                {profile.email && (
                  <div className={styles.contactDetailItem}>
                    <span className={styles.contactIcon}>✉️</span>
                    <span>{profile.email}</span>
                  </div>
                )}
                <div className={styles.contactDetailItem}>
                  <span className={styles.contactIcon}>📍</span>
                  <span>{profile.location || 'New York City, NY'}</span>
                </div>
              </div>
            </div>
            
            <ContactForm />
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          &copy; {new Date().getFullYear()} {profile.name}. All rights reserved.
        </p>
        <div style={{ marginBlockStart: 'var(--space-2)' }}>
          {/* <a href="/admin" className={styles.footerText} style={{ fontSize: 'var(--fs-xs)', opacity: 0.5 }}>
            🔑 Admin Dashboard
          </a> */}
        </div>
      </footer>
      </div>
      <AIChat />
    </>
  );
}
