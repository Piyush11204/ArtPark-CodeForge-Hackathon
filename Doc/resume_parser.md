#### 4. Resume Upload and Parse
 
API= "https://app.credxhire.com/api/resume/parse"

```typescript
import { useState } from 'react';
import axios from 'axios';
 
const API_BASE_URL = 'https://credx-flask-gcc4gffcatcsczcd.westus-01.azurewebsites.net';

 
interface ResumeData {
  personal_information: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  professional_summary: string;
  work_experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: {
    technical_skills: string[];
    soft_skills: string[];
  };
  certifications: string[];
  projects: Array<{
    name: string;
    description: string;
  }>;
  metadata: {
    filename: string;
    parsed_at: string;
    text_length: number;
    parser_version: string;
    openai_used: boolean;
  };
}
 
interface ParseResumeResponse {
  status: string;
  data: ResumeData;
}
 
export const ResumeUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
 
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF, DOCX, or TXT file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };
 
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
 
    setLoading(true);
    setError(null);
 
    const formData = new FormData();
    formData.append('file', file);
    formData.append('use_openai', 'true');
 
    try {
      const response = await axios.post<ParseResumeResponse>(
        `${API_BASE_URL}/parse_resume`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
 
      setResumeData(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to parse resume';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="resume-uploader">
      <h2>Upload Resume</h2>
      
      <div className="upload-section">
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={loading}
        />
        <button onClick={handleUpload} disabled={!file || loading}>
          {loading ? 'Parsing...' : 'Parse Resume'}
        </button>
      </div>
 
      {error && <div className="error">{error}</div>}
 
      {resumeData && (
        <div className="resume-data">
          <h3>Parsed Resume Data</h3>
          
          <section>
            <h4>Personal Information</h4>
            <p><strong>Name:</strong> {resumeData.personal_information.full_name}</p>
            <p><strong>Email:</strong> {resumeData.personal_information.email}</p>
            <p><strong>Phone:</strong> {resumeData.personal_information.phone}</p>
            <p><strong>Location:</strong> {resumeData.personal_information.location}</p>
          </section>
 
          <section>
            <h4>Professional Summary</h4>
            <p>{resumeData.professional_summary}</p>
          </section>
 
          <section>
            <h4>Technical Skills</h4>
            <ul>
              {resumeData.skills.technical_skills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          </section>
 
          <section>
            <h4>Work Experience</h4>
            {resumeData.work_experience.map((exp, index) => (
              <div key={index} className="experience-item">
                <h5>{exp.position} at {exp.company}</h5>
                <p className="duration">{exp.duration}</p>
                <p>{exp.description}</p>
              </div>
            ))}
          </section>
 
          <section>
            <h4>Education</h4>
            {resumeData.education.map((edu, index) => (
              <div key={index}>
                <p><strong>{edu.degree}</strong></p>
                <p>{edu.institution} - {edu.year}</p>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
};
```

Output :

{
  "awards_and_honors": [],
  "certifications": [
    {
      "credential_id": "",
      "credential_url": "",
      "expiry_date": "",
      "issue_date": "",
      "issuing_organization": "",
      "name": "HacktoberFest 2024 & 2025| CERTIFICATE October 7 2024"
    },
    {
      "credential_id": "",
      "credential_url": "",
      "expiry_date": "",
      "issue_date": "",
      "issuing_organization": "",
      "name": "JavaScript, JQuery and React (Udemy)[13 hours] | CERTIFICATE June 26, 2024  Email: piyushkrishna11@gmail.com"
    },
    {
      "credential_id": "",
      "credential_url": "",
      "expiry_date": "",
      "issue_date": "",
      "issuing_organization": "",
      "name": "Python for data Science, AI & Development (IBM) [25 hours]| CERTIFICATE June 21, 2024"
    },
    {
      "credential_id": "",
      "credential_url": "",
      "expiry_date": "",
      "issue_date": "",
      "issuing_organization": "",
      "name": "Foundations of User Experience (UX) Design (Google) [18 hours] | CERTIFICATE     February 3 2024 Stackpop Job Portal: Built and deployed a live job portal with authentication, resume uploads, and admin dashboard.Worked as the Full Stack Developer for MigooAI, an AI-driven content generation platform for an Israeli client, using React to build"
    },
    {
      "credential_id": "",
      "credential_url": "",
      "expiry_date": "",
      "issue_date": "",
      "issuing_organization": "",
      "name": "ACHIEVEMENTS & CERTIFICATES"
    },
    {
      "credential_id": "",
      "credential_url": "",
      "expiry_date": "",
      "issue_date": "",
      "issuing_organization": "",
      "name": "Hack-A-Thon: AI For Education 2025 (ThinkPlus Education) | CERTIFICATE"
    },
    {
      "credential_id": "",
      "credential_url": "",
      "expiry_date": "",
      "issue_date": "",
      "issuing_organization": "",
      "name": "DataVerse 2025 (Manav Rachna University x IEEE) | CERTIFICATE"
    },
    {
      "credential_id": "",
      "credential_url": "",
      "expiry_date": "",
      "issue_date": "",
      "issuing_organization": "",
      "name": "Blockchain Basics, (Cyfrin Updraft) | CERTIFICATE June 08, 2025"
    }
  ],
  "education": [
    {
      "activities": [],
      "degree": "BE",
      "description": "",
      "end_date": "2026-08-01",
      "field_of_study": "Information Technology",
      "gpa": "7.52/10",
      "grade": "Honors",
      "institution": "Vidyavardhini's College Of Engineering & Technology",
      "location": "Mumbai, India",
      "percentage": null,
      "start_date": "2022-11-01"
    },
    {
      "activities": [],
      "degree": "HSC",
      "description": "",
      "end_date": "2021-08-01",
      "field_of_study": null,
      "gpa": null,
      "grade": null,
      "institution": "H.D Save College of Arts and Science",
      "location": "Mumbai, India",
      "percentage": "75.80%",
      "start_date": "2020-06-01"
    }
  ],
  "hobbies": [],
  "interests": [],
  "languages": [],
  "metadata": {
    "filename": "Piyush-Yadav-Resume.pdf",
    "openai_used": true,
    "parsed_at": "",
    "parser_version": "7.2",
    "text_length": 4232,
    "total_tokens_used": 1694
  },
  "personal_information": {
    "country": "India",
    "date_of_birth": "",
    "email": "piyushkrishna11@gmail.com",
    "first_name": "Piyush",
    "full_address": "",
    "full_name": "Piyush Krishnadutt Yadav",
    "github": "",
    "job_title": "",
    "last_name": "Krishnadutt Yadav",
    "leetcode": "",
    "linkedin": "",
    "location": {
      "address": "HSC :75.80% Mumbai, India",
      "city": "Mumbai",
      "country": "India",
      "postal_code": "",
      "state": ""
    },
    "other_links": [],
    "phone": "+91 7558565929",
    "portfolio_website": "",
    "state": "",
    "twitter": "",
    "work_status": "Not Specified"
  },
  "professional_memberships": [],
  "professional_summary": "",
  "projects": [
    {
      "description": "AI-Powered Learning Management System",
      "end_date": null,
      "github_url": "",
      "project_name": "Learning Sphere",
      "start_date": "2025-08-01",
      "technologies_used": [],
      "url": ""
    },
    {
      "description": "AI-Based Yoga Pose Correction. EasyYoga uses AI/ML to analyze your yoga poses, offering real-time insights and tailored suggestions for improvement. Access pre-recorded tutorials, one-on-one video cal...",
      "end_date": "2024-10-01",
      "github_url": "",
      "project_name": "EasyYoga",
      "start_date": "2024-09-24",
      "technologies_used": [],
      "url": ""
    },
    {
      "description": "Built and deployed a live job portal with authentication, resume uploads, and admin dashboard.",
      "end_date": null,
      "github_url": "",
      "project_name": "Stackpop Job Portal",
      "start_date": null,
      "technologies_used": [],
      "url": ""
    },
    {
      "description": "Worked as the Full Stack Developer for MigooAI, an AI-driven content generation platform for an Israeli client, using React to build dynamic user interfaces and ensure smooth user experiences.",
      "end_date": null,
      "github_url": "",
      "project_name": "MigooAI",
      "start_date": null,
      "technologies_used": [],
      "url": ""
    },
    {
      "description": "Currently developing a real-time multiplayer game with dynamic scoring and leaderboard logic.",
      "end_date": null,
      "github_url": "",
      "project_name": "Cricket Card Game",
      "start_date": null,
      "technologies_used": [],
      "url": ""
    },
    {
      "description": "Engineered a secure, full-stack MERN-based LMS with JWT + Google reCAPTCHA authentication, multi-role dashboards (Admin, Tutor, Learner), and RBAC architecture ensuring scalable and protected access c...",
      "end_date": null,
      "github_url": "",
      "project_name": "Full-stack MERN-based LMS",
      "start_date": null,
      "technologies_used": [],
      "url": ""
    },
    {
      "description": "Built an AI & ML-driven adaptive exam system (fullscreen-only with anti-extension security) that dynamically adjusts difficulty, generates personalized AI performance reports, and automates skill-base...",
      "end_date": null,
      "github_url": "",
      "project_name": "AI & ML-driven adaptive exam system",
      "start_date": null,
      "technologies_used": [],
      "url": ""
    },
    {
      "description": "Worked on Angular-based frontend development for CredXHire.com, a hiring platform supporting multiple user roles and workflows, and currently contributing to Visibol, a service-providing platform, by ...",
      "end_date": null,
      "github_url": "",
      "project_name": "Frontend Developer Intern - CredX",
      "start_date": "2025-12-01",
      "technologies_used": [],
      "url": ""
    }
  ],
  "publications": [],
  "references": [],
  "skills": {
    "databases": [
      "MongoDB",
      "MySQL",
      "SQLite",
      "Firebase"
    ],
    "frameworks": [
      "React",
      "Angular",
      "Next.js",
      "Flask",
      "Flutter",
      "jQuery",
      "LangChain",
      "MERN Stack",
      "MERN"
    ],
    "languages": [],
    "soft_skills": [],
    "technical_skills": [
      "Python",
      "JavaScript",
      "NLP",
      "Generative AI",
      "AI",
      "ML",
      "Hugging Face",
      "Agentic Rag",
      "RAG"
    ],
    "tools_and_technologies": [
      "Git",
      "GitHub",
      "Docker",
      "Visual Studio Code",
      "Android Studio",
      "Postman",
      "Jupyter Notebook",
      "Google Cloud",
      "Vercel",
      "Netlify",
      "Render"
    ]
  },
  "volunteer_experience": [],
  "work_experience": []
}
 
---