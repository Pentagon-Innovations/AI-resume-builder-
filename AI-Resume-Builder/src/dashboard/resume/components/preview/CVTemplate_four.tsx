import React from 'react';

const CVTemplate_four = ({ resumeInfo }) => {
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
    profilePhoto
  } = resumeInfo;

  const getImageSrc = (bufferData: any) => {
    if (!bufferData || !bufferData.data) return "default-profile.png"; // Fallback image

    // Convert Buffer data array to a Uint8Array
    const uint8Array = new Uint8Array(bufferData.data);

    // Create a Blob from Uint8Array
    const blob = new Blob([uint8Array], { type: "image/png" });

    // Generate a URL for the blob
    return URL.createObjectURL(blob);
  };

  return (
    <div className="cv-template-four">
      <div className="bg-gray-100">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 flex">
          {/* Left Column */}
          <div className="w-2/3 pr-6">
            <h1 className="text-3xl font-bold text-gray-800">{`${firstName} ${lastName}`}</h1>
            <h3 className="text-xl text-gray-600">{jobTitle}</h3>

            {/* Personal Summary */}
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-700">Personal Summary</h2>
              <p className="text-gray-600 mt-2">{summery}</p>
            </div>

            {/* Experience */}
            {experience.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-700">Experience</h2>
                {experience.map((exp, index) => (
                  <div className="mt-4 border-l-4 border-blue-500 pl-4" key={index}>
                    <h3 className="text-md font-semibold">{exp.title} - {exp.companyName}</h3>
                    <p className="text-gray-500 text-sm">{exp.city}, {exp.state} ({exp.startDate} - {exp.endDate})</p>
                    <div className="text-gray-600 text-sm mt-2" dangerouslySetInnerHTML={{ __html: exp.description }}></div>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-700">Education</h2>
                {education.map((edu, index) => (
                  <div className="mt-4 border-l-4 border-green-500 pl-4" key={index}>
                    <h3 className="text-md font-semibold">{edu.degree} in {edu.major}</h3>
                    <p className="text-gray-500 text-sm">{edu.universityName} ({edu.startDate} - {edu.endDate})</p>
                    <p className="text-gray-600 text-sm">{edu.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="w-1/3 bg-gray-200 p-6 rounded-lg">
            <img src={getImageSrc(profilePhoto?.data)} alt="Profile" className="w-32 h-32 mx-auto rounded-full border-4 border-gray-400" />

            {/* Personal Information */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-700">Personal Information</h2>
              <p className="text-gray-600 mt-2">{address}</p>
            </div>

            {/* Contact Information */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-700">Contact Information</h2>
              <p className="text-gray-600 mt-2"><strong>Email:</strong> {email}</p>
              <p className="text-gray-600"><strong>Phone:</strong> {phone}</p>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-700">Skills</h2>
                <ul className="mt-2 space-y-2">
                  {skills.map((skill, index) => (
                    <li key={index} className="text-gray-600 flex justify-between">
                      <span>{skill.name}</span>
                      <span className="text-gray-800 font-semibold">{skill.rating}/5</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVTemplate_four;
