import { NextResponse } from 'next/server';
import { getProfile, getProjects, getSkills } from '@/lib/supabase';

// Simple types for local chat history
interface HistoryItem {
  role: 'user' | 'model';
  text: string;
}

// Smart Mock Responder for Demo Mode
async function handleDemoMode(message: string): Promise<string> {
  const msg = message.toLowerCase();
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (msg.includes('skill') || msg.includes('language') || msg.includes('tech') || msg.includes('stack')) {
    const skills = await getSkills();
    const skillNames = skills.map((s) => `${s.name} (${s.proficiency}%)`).join(', ');
    return `Shanmuga's technical skills include: ${skillNames}. He specializes in React, Next.js, and TypeScript for the frontend, and Node.js with Supabase on the backend!`;
  }
  
  if (msg.includes('project') || msg.includes('work') || msg.includes('ecosync') || msg.includes('aether')) {
    const projects = await getProjects();
    const projectList = projects.map((p, i) => `${i + 1}) ${p.title}: ${p.description}`).join('\n');
    return `Shanmuga has built several outstanding projects. Here are a few:\n${projectList}\n\nYou can click the links on the main page to check their GitHub repos and live sites!`;
  }

  if (msg.includes('contact') || msg.includes('email') || msg.includes('reach') || msg.includes('message') || msg.includes('find')) {
    const profile = await getProfile();
    return `You can reach Shanmuga directly at his email: **${profile.email || 'abc@gmail.com'}**. You can also send a message using the Contact Form right here on this page, or connect with him via GitHub/LinkedIn.`;
  }

  if (msg.includes('intern') || msg.includes('job') || msg.includes('hire') || msg.includes('work') || msg.includes('avail')) {
    return `Yes! Shanmuga is actively seeking summer internships and junior software engineering roles. He has a solid foundation in computer science and hands-on experience building full-stack web apps.`;
  }

  if (msg.includes('gpa') || msg.includes('grade') || msg.includes('cgpa') || msg.includes('education') || msg.includes('g.p.a.')) {
    return `Shanmuga is a Computer Science student with a Cumulative GPA of **9.0**! He has demonstrated strong academic and practical engineering skills.`;
  }

  if (msg.includes('hello') || msg.includes('hi ') || msg.includes('hey') || msg.includes('greet')) {
    return `Hello! 👋 I'm Shanmuga's portfolio chatbot. Feel free to ask me about his skills, projects, contact info, or GPA! (Currently operating in Demo Mode).`;
  }

  return `Thanks for asking! (Note: I'm currently running in **Demo Mode** because no \`GEMINI_API_KEY\` is configured). Shanmuga is a skilled developer with experience in Next.js, Supabase, and CSS. Check out his projects on this page!`;
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.log('Gemini API Key missing. Falling back to Demo Mode.');
      const demoReply = await handleDemoMode(message);
      return NextResponse.json({ reply: demoReply });
    }

    // Fetch portfolio context from Supabase concurrently
    const [profile, projects, skills] = await Promise.all([
      getProfile(),
      getProjects(),
      getSkills(),
    ]);

    // Construct system instructions with portfolio context
    const skillsListStr = skills.map((s) => `- ${s.name} (${s.category}, proficiency: ${s.proficiency}%)`).join('\n');
    const projectsListStr = projects.map((p) => `- ${p.title}: ${p.description} (Tags: ${p.tags.join(', ')})`).join('\n');

    const systemInstruction = `
You are the personal AI Assistant for Shanmuga Nathan Manavalan's portfolio website.
Your job is to answer questions from recruiters and visitors about Shanmuga's background, skills, projects, and contact info in a helpful, friendly, and professional manner.

Here is the context about Shanmuga Nathan Manavalan:
- **Name**: ${profile.name}
- **Role/Bio**: ${profile.role}. ${profile.bio}
- **Location**: ${profile.location || 'New York City, NY'}
- **Email**: ${profile.email || 'abc@gmail.com'}
- **GitHub**: ${profile.github_url || 'https://github.com'}
- **LinkedIn**: ${profile.linkedin_url || 'https://linkedin.com'}
- **Cumulative GPA**: 9.0
- **Availability**: Actively seeking software engineering opportunities and summer internships.

**Skills**:
${skillsListStr}

**Projects**:
${projectsListStr}

**Rules for your replies**:
1. Be polite, concise, and helpful.
2. Keep replies short (typically 2-4 sentences or simple bullet points) so they fit nicely in the chat bubble UI.
3. Only talk about Shanmuga. If someone asks unrelated questions, politely refuse to answer.
4. If you don't know the answer or it's not in the context, say that you don't have that specific detail but they can contact Shanmuga directly at ${profile.email || 'abc@gmail.com'}.
`;

    // Map history to Gemini's format: { role: 'user' | 'model', parts: [{ text: string }] }
    const contents = [
      ...((history || []) as HistoryItem[]).map((item) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    // Call Gemini 1.5 Flash API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API call failed:', errorText);
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const responseData = await response.json();
    
    // Extract generated text
    const reply =
      responseData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't generate a response. Please reach out to me via email!";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('API Error in /api/chat:', error);
    // Graceful fallback to Mock Responder on error
    try {
      const body = await req.clone().json();
      const demoReply = await handleDemoMode(body.message || '');
      return NextResponse.json({
        reply: `⚠️ (Demo Mode Fallback) ${demoReply}`,
      });
    } catch {
      return NextResponse.json(
        { reply: "I'm having trouble connecting right now. Please try again or email me!" },
        { status: 200 }
      );
    }
  }
}
