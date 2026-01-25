const puppeteer = require('puppeteer');

async function generatePdf(htmlContent, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  await page.pdf({ path: outputPath, format: 'A4' });
  await browser.close();
}

// Example usage
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>My Resume</title>
  <style>
    /* Basic Styling */
    body {
      font-family: sans-serif;
      margin: 20px;
    }

    h2 {
      margin-top: 1.5em;
    }

    .section {
      margin-bottom: 2em;
    }

    /* Professional Experience Styling */
    .experience-item {
      margin-bottom: 1em;
    }

    /* Skills Styling */
    .skills-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      grid-gap: 1em;
    }

    .skill-bar {
      background-color: #eee;
      height: 10px;
      border-radius: 5px;
      overflow: hidden;
    }

    .skill-bar-fill {
      background-color: #007bff;
      height: 100%;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Koteeswaran Ramachandran</h1>
    <h2>UI Developer</h2>
    <p>Vellalar Street, 17/80</p>
    <p>09840599416 | kodee.ramachandran@gmail.com</p>

    <div class="section">
      <h2>Summary</h2>
      <p>A skilled UI developer with 5+ years of experience building and maintaining user interfaces for web and mobile applications. Proven ability to translate designs and wireframes into clean, efficient, and reusable code. Expertise in HTML, CSS, JavaScript, and popular UI frameworks such as React, Angular, or Vue.  Strong understanding of responsive design principles and cross-browser compatibility.</p>
    </div>

    <div class="section">
      <h2>Professional Experience</h2>
      <div class="experience-item">
        <h3>Senior Developer</h3>
        <p>sixt, München, Bayern | December 19, 2024 - February 19, 2025</p>
        <ul>
          <li>Spearheaded the design and development of a high-performance, scalable application resulting in a 30% increase in user engagement.</li>
          <li>Architected and implemented a robust and secure microservices architecture, improving system stability and reducing downtime by 20%.</li>
          <li>Mentored junior developers, providing technical guidance and fostering a collaborative team environment.</li>
          <li>Successfully migrated legacy systems to a cloud-based infrastructure, optimizing resource utilization and reducing operational costs.</li>
          <li>Led the development and implementation of a new API, improving data integration and streamlining workflows.</li>
          <li>Proficiently utilized various technologies including Java, Spring Boot, AWS, and Kubernetes to deliver high-quality software solutions.</li>
          <li>Championed best practices in software development, including Agile methodologies and continuous integration/continuous deployment (CI/CD).</li>
        </ul>
      </div>
      <div class="experience-item">
        <h3>Lead Developer</h3>
        <p>HCL, Chennai, Tamil Nadu | June 5, 2024 - October 24, 2024</p>
        <ul>
          <li>Provided technical leadership and guidance to a team of 5 developers, mentoring junior team members and fostering a collaborative environment.</li>
          <li>Successfully delivered multiple complex software projects on time and within budget, consistently exceeding expectations.</li>
          <li>Architected and implemented a new microservices architecture resulting in improved scalability, maintainability, and reduced operational costs.</li>
          <li>Played a key role in defining and implementing the team's software development processes, including Agile methodologies and CI/CD pipelines.</li>
          <li>Developed and maintained comprehensive technical documentation, ensuring clear communication and knowledge sharing within the team.</li>
          <li>Proactively identified and resolved critical system issues, minimizing downtime and ensuring system stability.</li>
          <li>Successfully migrated legacy systems to a modern, cloud-based infrastructure, improving performance and reducing maintenance overhead.</li>
        </ul>
      </div>
      <div class="experience-item">
        <h3>Senior Software Developer</h3>
        <p>sedi technology, Chennai, Tamil Nadu | January 1, 2023 - December 31, 2023</p>
        <ul>
          <li>Led the design and development of a key feature for a major software release, resulting in a 25% improvement in user satisfaction.</li>
          <li>Mentored junior developers, providing technical guidance and code reviews to ensure high-quality deliverables.</li>
          <li>Implemented a new testing framework that reduced bug detection time by 40%, leading to improved software quality.</li>
          <li>Successfully integrated several third-party APIs, expanding the functionality of the software and improving user experience.</li>
          <li>Architected and implemented a scalable and robust solution for handling increased data volume, preventing system bottlenecks.</li>
          <li>Proficiently used various technologies including Java, Spring, and AWS to deliver high-quality software solutions.</li>
          <li>Contributed to the improvement of the software development lifecycle, implementing best practices in Agile methodologies and CI/CD.</li>
        </ul>
      </div>
      <div class="experience-item">
        <h3>Software Engineer</h3>
        <p>change pond tech, Chennai, Tamil Nadu | January 1, 2020 - December 31, 2022</p>
        <ul>
          <li>Developed and maintained key features for a high-traffic web application using Java and Spring Framework.</li>
          <li>Implemented unit and integration tests to ensure code quality and prevent regressions.</li>
          <li>Collaborated with cross-functional teams including product managers, designers, and QA engineers to deliver successful projects.</li>
          <li>Debugged and resolved complex software issues, improving application performance and stability.</li>
          <li>Contributed to the improvement of existing codebases through refactoring and code optimization.</li>
          <li>Utilized Git for version control and collaborated effectively within a team environment using Agile methodologies.</li>
          <li>Learned and implemented new technologies to enhance the software development process and improve product features.</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>Education</h2>
      <div class="experience-item">
        <h3>Kamaraj College</h3>
        <p>Bachelor of Science in Computer Science | March 7, 2002 - April 1, 2005</p>
        <p>Computer Science</p>
      </div>
      <div class="experience-item">
        <h3>Madras University</h3>
        <p>Master of Computer Application in Computer Science | April 1, 2006 - April 1, 2009</p>
        <p>Computer Application</p>
      </div>
    </div>

    <div class="section">
      <h2>Skills</h2>
      <div class="skills-container">
        <div>
          <p>React</p>
          <div class="skill-bar">
            <div class="skill-bar-fill" style="width: 90%;"></div>
          </div>
        </div>
        <div>
          <p>Angular</p>
          <div class="skill-bar">
            <div class="skill-bar-fill" style="width: 80%;"></div>
          </div>
        </div>
        <div>
          <p>JavaScript</p>
          <div class="skill-bar">
            <div class="skill-bar-fill" style="width: 95%;"></div>
          </div>
        </div>
        <div>
          <p>HTML</p>
          <div class="skill-bar">
            <div class="skill-bar-fill" style="width: 90%;"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
const outputPath = 'output.pdf';
generatePdf(htmlContent, outputPath);