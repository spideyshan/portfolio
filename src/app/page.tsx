import { getProfile, getProjects, getSkills } from '@/lib/supabase';
import ProjectGrid from '@/components/ProjectGrid';
import ContactForm from '@/components/ContactForm';
import styles from './page.module.css';

export const revalidate = 60; // Revalidate cache every 60 seconds

export default async function Home() {
  // Fetch data concurrently on the server
  const [profile, projects, skills] = await Promise.all([
    getProfile(),
    getProjects(),
    getSkills(),
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
      {/* Navigation Header */}
      <header className={styles.header}>
        <nav className={styles.nav}>
          <div className={styles.logo}>
            <span>Portfolio</span>
            <span className={styles.logoDot} />
          </div>
          <ul className={styles.navLinks}>
            <li>
              <a href="#about" className={styles.navLink}>
                About
              </a>
            </li>
            <li>
              <a href="#projects" className={styles.navLink}>
                Projects
              </a>
            </li>
            <li>
              <a href="#skills" className={styles.navLink}>
                Skills
              </a>
            </li>
            <li>
              <a href="#contact" className={styles.navLink}>
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <div className={styles.container}>
        <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroSubtitle}>Hello World, I'm</span>
            <h1 className={styles.heroTitle}>
              <span className="text-gradient">{profile.name}</span>
            </h1>
            <p className={styles.heroBio}>{profile.role}</p>
            <div className={styles.heroButtons}>
              <a href="#contact" className={`${styles.btn} ${styles.btnPrimary}`}>
                Get In Touch
              </a>
              <a href="#projects" className={`${styles.btn} ${styles.btnSecondary}`}>
                View Projects
              </a>
            </div>
          </div>
          
          <div className={styles.heroVisual}>
            <div className={styles.heroArt}>
              <img
                src={profile.avatar_url || 'https://lh3.googleusercontent.com/d/1TVZ-Oen9krePPrwk8dO3L_JroPKSMsWz'}
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
                  src={profile.avatar_url_about || profile.avatar_url || 'https://lh3.googleusercontent.com/d/1KovBCy_E1whsaxKAVIrH-AWKgNQ2GkFL'}
                  alt={profile.name}
                  className={styles.avatar}
                />
              </div>
              <h3 className={styles.profileName}>{profile.name}</h3>
              <p className={styles.profileRole}>{profile.role}</p>
              
              <div className={styles.socialLinks}>
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="GitHub">
                    🐙
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="LinkedIn">
                    💼
                  </a>
                )}
                {profile.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Twitter">
                    🐦
                  </a>
                )}
              </div>
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

        {/* Projects Section */}
        <section id="projects" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>My Works</span>
            <h2 className={styles.sectionTitle}>Featured Projects</h2>
          </div>
          
          <ProjectGrid initialProjects={projects} />
        </section>

        {/* Skills Section */}
        <section id="skills" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Expertise</span>
            <h2 className={styles.sectionTitle}>Skills & Technologies</h2>
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
                        <span className={styles.skillProficiency}>{skill.proficiency}%</span>
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

        {/* Contact Section */}
        <section id="contact" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Get in touch</span>
            <h2 className={styles.sectionTitle}>Contact Me</h2>
          </div>
          
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <h3 className={styles.contactHeading}>Let's talk about your project</h3>
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
                  <span>New York City, NY</span>
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
          <a href="/admin" className={styles.footerText} style={{ fontSize: 'var(--fs-xs)', opacity: 0.5 }}>
            🔑 Admin Dashboard
          </a>
        </div>
      </footer>
      </div>
    </>
  );
}
