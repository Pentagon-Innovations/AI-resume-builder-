import React from 'react';
import { formatDate } from '@/lib/utils';

interface Skill {
  name: string;
  rating: number;
  _id: string;
}

interface Experience {
  title: string;
  companyName: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  workSummery: string;
  description?: string;
}

interface Education {
  universityName: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ResumeInfo {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  address: string;
  summery: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  profilePhoto?: string;
}

interface ResumeProps {
  resumeInfo: ResumeInfo;
}

const CVTemplate_three = ({ resumeInfo }: ResumeProps) => {
  const {
    firstName,
    lastName,
    jobTitle,
    email,
    phone,
    address,
    summery,
    experience = [],
    education = [],
    skills = [],
    profilePhoto,
  } = resumeInfo;





  return (
    <div className="cv-template-three">
      <div className="resume">
        {/* Left Column */}
        <div className="left-column">
          <img src={typeof resumeInfo?.profilePhoto === 'string' ? resumeInfo?.profilePhoto : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, "") + '/resumes/' + resumeInfo?.resumeId + '/photo'}
            alt="Profile Picture"
            className="profile-pic"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
          <h2>{`${firstName} ${lastName}`}</h2>
          <p>{jobTitle}</p>
          <hr />
          <div className="section">
            <h3>Contact</h3>
            <p>Email: {email}</p>
            <p>Phone: {phone}</p>
            <p>Address: {address}</p>
          </div>
          <div className="section skills">
            <h3>Skills</h3>
            {skills.map((skill) => (
              <span key={skill._id}>{skill.name}</span>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column">
          <div className="section">
            <h3>Summary</h3>
            <p>{summery}</p>
          </div>
          <div className="section">
            <h3>Work Experience</h3>
            {experience.map((exp, index) => (
              <div key={index}>
                <h4>{`${exp.title} | ${exp.companyName}`}</h4>
                <p>{`${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}`}</p>
                <div dangerouslySetInnerHTML={{ __html: exp.description }} />
              </div>
            ))}
          </div>
          <div className="section">
            <h3>Education</h3>
            {education.map((edu, index) => (
              <div key={index}>
                <h4>{`${edu.degree} in ${edu.major}`}</h4>
                <p>{`${edu.universityName} | ${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVTemplate_three;