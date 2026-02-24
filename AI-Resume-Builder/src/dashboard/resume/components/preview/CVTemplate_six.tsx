import React from 'react';
import { formatDate } from '@/lib/utils';

const CVTemplate_six = ({ resumeInfo }) => {
    const {
        firstName,
        lastName,
        jobTitle,
        address,
        phone,
        email,
        summery,
        experience = [],
        education = [],
        skills = [],
        themeColor = "#2d3748"
    } = resumeInfo;

    return (
        <div className="cv-template-six">
            <div className="executive-container">
                <div className="sidebar" style={{ backgroundColor: themeColor }}>
                    <div className="profile-section">
                        <img src={typeof resumeInfo?.profilePhoto === 'string' ? resumeInfo?.profilePhoto : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, "") + '/resumes/' + resumeInfo?.resumeId + '/photo'}
                            alt='profile'
                            className='profile-photo'
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                    </div>

                    <div className="contact-info">
                        <h3>Contact</h3>
                        <p>{phone}</p>
                        <p>{email}</p>
                        <p>{address}</p>
                    </div>

                    <div className="skills-section">
                        <h3>Skills</h3>
                        {skills.map((skill, index) => (
                            <div key={index} className="skill-item">
                                <span>{skill.name}</span>
                                <div className="skill-bar-bg">
                                    <div className="skill-bar-fill" style={{ width: `${skill.rating * 10}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="main-content">
                    <header className="header">
                        <h1 style={{ color: themeColor }}>{firstName} {lastName}</h1>
                        <h2 className="job-title">{jobTitle}</h2>
                    </header>

                    <section className="section">
                        <h3 className="section-title" style={{ borderBottom: `2px solid ${themeColor}` }}>Professional Summary</h3>
                        <p>{summery}</p>
                    </section>

                    {experience.length > 0 && (
                        <section className="section">
                            <h3 className="section-title" style={{ borderBottom: `2px solid ${themeColor}` }}>Experience</h3>
                            {experience.map((exp, index) => (
                                <div key={index} className="experience-item">
                                    <div className="exp-header">
                                        <span className="exp-title">{exp.title}</span>
                                        <span className="exp-date">{formatDate(exp.startDate)} - {formatDate(exp.endDate)}</span>
                                    </div>
                                    <div className="exp-company">{exp.companyName} | {exp.city}, {exp.state}</div>
                                    <div className="exp-description" dangerouslySetInnerHTML={{ __html: exp.description }} />
                                </div>
                            ))}
                        </section>
                    )}

                    {education.length > 0 && (
                        <section className="section">
                            <h3 className="section-title" style={{ borderBottom: `2px solid ${themeColor}` }}>Education</h3>
                            {education.map((edu, index) => (
                                <div key={index} className="education-item">
                                    <div className="edu-header">
                                        <span className="edu-school">{edu.universityName}</span>
                                        <span className="edu-date">{formatDate(edu.startDate)} - {formatDate(edu.endDate)}</span>
                                    </div>
                                    <div className="edu-degree">{edu.degree} in {edu.major}</div>
                                    <p className="edu-desc">{edu.description}</p>
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CVTemplate_six;
