
import React from 'react';

const CVTemplate_one = ({ resumeInfo }) => {
  const {
    firstName,
    lastName,
    jobTitle,
    email,
    phone,
    address,
    summery,
    experience = [], // Default to an empty array if undefined
    education = [], // Default to an empty array if undefined
    skills = [], // Default to an empty array if undefined
  } = resumeInfo;

  return (
    <div className="cv-template-one">
      <div id="doc2" className="yui-t7">
        <div id="inner">
          <div id="hd">
            <div className="yui-gc">
              <div className="yui-u first">
                <h1>{firstName} {lastName}</h1>
                <h2>{jobTitle}</h2>
              </div>
              <div className="yui-u">
                <div className="contact-info">
                  <h3><a href={`mailto:${email}`}>{email}</a></h3>
                  <h3>{phone}</h3>
                  <h3>{address}</h3>
                </div>
              </div>
            </div>
          </div>

          <div id="bd">
            <div id="yui-main">
              <div className="yui-b">
                <div className="yui-gf">
                  <div className="yui-u first">
                    <h2>Summary</h2>
                  </div>
                  <div className="yui-u">
                    {summery && <p className="text-xs">{summery}</p>}

                  </div>
                </div>

                {experience.length > 0 && (
                  <div className="yui-gf">
                    <div className="yui-u first">
                      <h2>Professional Experience</h2>
                    </div>
                    <div className="yui-u">
                      {experience.map((exp, index) => (
                        <div className="job" key={index}>
                          <h2>{exp.title}</h2>
                          <h3>{exp.companyName}, {exp.city}, {exp.state}</h3>
                          <h4>{exp.startDate} - {exp.endDate}</h4>
                          <p dangerouslySetInnerHTML={{ __html: exp.description }}></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {education.length > 0 && (
                  <div className="yui-gf">
                    <div className="yui-u first">
                      <h2>Education</h2>
                    </div>
                    <div className="yui-u">
                      {education.map((edu, index) => (
                        <div className="education" key={index}>
                          <h2>{edu.universityName}</h2>
                          <h3>{edu.degree} in {edu.major}</h3>
                          <h4>{edu.startDate} - {edu.endDate}</h4>
                          <p>{edu.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {skills.length > 0 && (
                  <div className="yui-gf">
                    <div className="yui-u first">
                      <h2>Skills</h2>
                    </div>
                    <div className="yui-u">
                      {skills.map((skill, index) => (
                        <div className="talent" key={index}>
                          <h2>{skill.name}</h2>
                          <div className="skill-bar">
                            <div className="skill-level" style={{ width: `${skill.rating * 10}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div id="ft">
            <p>{firstName} {lastName} &mdash; <a href={`mailto:${email}`}>{email}</a> &mdash; {phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVTemplate_one;