import React from 'react';

const CVTemplate_five = ({ resumeInfo }) => {
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
        themeColor = "#4a5568"
    } = resumeInfo;

    return (
        <div className="cv-template-five">
            <div className="classic-container">
                <header className="header" style={{ borderBottom: `3px solid ${themeColor}` }}>
                    <h1 style={{ color: themeColor }}>{firstName} {lastName}</h1>
                    <p className="job-title">{jobTitle}</p>
                    <div className="contact-grid">
                        <span>{phone}</span>
                        <span>{email}</span>
                        <span>{address}</span>
                    </div>
                </header>

                <section className="section">
                    <h2 style={{ color: themeColor }}>Summary</h2>
                    <p>{summery}</p>
                </section>

                {experience.length > 0 && (
                    <section className="section">
                        <h2 style={{ color: themeColor }}>Experience</h2>
                        {experience.map((exp, index) => (
                            <div key={index} className="item">
                                <div className="item-header">
                                    <strong>{exp.title}</strong>
                                    <span>{exp.startDate} - {exp.endDate}</span>
                                </div>
                                <div className="item-sub">
                                    <span>{exp.companyName}</span>
                                    <span>{exp.city}, {exp.state}</span>
                                </div>
                                <div className="description" dangerouslySetInnerHTML={{ __html: exp.description }} />
                            </div>
                        ))}
                    </section>
                )}

                {education.length > 0 && (
                    <section className="section">
                        <h2 style={{ color: themeColor }}>Education</h2>
                        {education.map((edu, index) => (
                            <div key={index} className="item">
                                <div className="item-header">
                                    <strong>{edu.universityName}</strong>
                                    <span>{edu.startDate} - {edu.endDate}</span>
                                </div>
                                <div className="item-sub">
                                    <span>{edu.degree} in {edu.major}</span>
                                </div>
                                <p>{edu.description}</p>
                            </div>
                        ))}
                    </section>
                )}

                {skills.length > 0 && (
                    <section className="section">
                        <h2 style={{ color: themeColor }}>Skills</h2>
                        <div className="skills-list">
                            {skills.map((skill, index) => (
                                <span key={index} className="skill-tag" style={{ border: `1px solid ${themeColor}`, color: themeColor }}>
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default CVTemplate_five;
