import React from 'react';

const CVTemplate = ({ resumeInfo }) => {
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
    themeColor = "#ff6666"
  } = resumeInfo;

  return (
    <div id="root">
      <div className="md:grid-cols-2">
        <div
          className="shadow-lg h-full p-14 border-t-[20px]"
          style={{ borderColor: themeColor }}
        >
          <div>
            <h2
              className="font-bold text-xl text-center"
              style={{ color: themeColor }}
            >
              {firstName} {lastName}
            </h2>
            <h2 className="text-center text-sm font-medium">{jobTitle}</h2>
            <h2
              className="text-center font-normal text-xs"
              style={{ color: themeColor }}
            >
              {address}
            </h2>

            <div className='flex justify-center my-4'>
              {/* Display Profile Photo */}
              <img src={(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, "") + '/resumes/' + resumeInfo?.resumeId + '/photo'}
                alt='profile'
                className='h-[100px] w-[100px] rounded-full object-cover'
                onError={(e) => e.target.style.display = 'none'} // Hide if no photo
              />
            </div>
            <div className="flex justify-between">
              <h2 className="font-normal text-xs" style={{ color: themeColor }}>
                {phone}
              </h2>
              <h2 className="font-normal text-xs" style={{ color: themeColor }}>
                {email}
              </h2>
            </div>
            <hr
              className="border-[1.5px] my-2"
              style={{ borderColor: themeColor }}
            />
          </div>
          {summery && <p className="text-xs">{summery}</p>}

          {/* Professional Experience Section */}
          {experience.length > 0 && (
            <div className="my-6">
              <h2
                className="text-center font-bold text-sm mb-2"
                style={{ color: themeColor }}
              >
                Professional Experience
              </h2>
              <hr style={{ borderColor: themeColor }} />
              {experience.map((exp, index) => (
                <div className="my-5" key={index}>
                  <h2 className="text-sm font-bold" style={{ color: themeColor }}>
                    {exp.title}
                  </h2>
                  <h2 className="text-xs flex justify-between">
                    {exp.companyName}, {exp.city}, {exp.state}
                    <span>
                      {exp.startDate} To {exp.endDate}
                    </span>
                  </h2>
                  <div className="text-xs my-2" dangerouslySetInnerHTML={{ __html: exp.description }} />
                </div>
              ))}
            </div>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <div className="my-6">
              <h2
                className="text-center font-bold text-sm mb-2"
                style={{ color: themeColor }}
              >
                Education
              </h2>
              <hr style={{ borderColor: themeColor }} />
              {education.map((edu, index) => (
                <div className="my-5" key={index}>
                  <h2 className="text-sm font-bold" style={{ color: themeColor }}>
                    {edu.universityName}
                  </h2>
                  <h2 className="text-xs flex justify-between">
                    {edu.degree} in {edu.major}
                    <span>
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </h2>
                  <p className="text-xs my-2">{edu.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Skills Section */}
          {skills.length > 0 && (
            <div className="my-6">
              <h2
                className="text-center font-bold text-sm mb-2"
                style={{ color: themeColor }}
              >
                Skills
              </h2>
              <hr style={{ borderColor: themeColor }} />
              <div className="grid grid-cols-2 gap-3 my-4">
                {skills.map((skill, index) => (
                  <div className="flex items-center justify-between" key={index}>
                    <h2 className="text-xs">{skill.name}</h2>
                    <div className="h-2 bg-gray-200 w-[120px]">
                      <div
                        className="h-2"
                        style={{ width: `${skill.rating * 10}%`, backgroundColor: themeColor }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVTemplate;