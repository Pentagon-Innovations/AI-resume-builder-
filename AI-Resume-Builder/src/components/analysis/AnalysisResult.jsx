"use client";

import { useState } from "react";
import GlobalApi from "service/GlobalApi";

export default function AnalysisResult({ result, selectedresume }) {
  const [tab, setTab] = useState("skills");
  const [isImprovingAll, setIsImprovingAll] = useState(false);

  // ⭐ Score-based configuration
  const getScoreConfig = (score) => {
    if (score >= 80) return {
      color: "from-emerald-400 to-green-600",
      bg: "bg-green-50",
      text: "text-green-700",
      status: "Excellent Match",
      label: "Your resume is highly optimized for this role!"
    };
    if (score >= 50) return {
      color: "from-blue-400 to-indigo-600",
      bg: "bg-blue-50",
      text: "text-indigo-700",
      status: "Good Match",
      label: "Solid foundation, but some key areas can be improved."
    };
    return {
      color: "from-orange-400 to-red-600",
      bg: "bg-red-50",
      text: "text-red-700",
      status: "Needs Improvement",
      label: "Significant gaps detected. Follow the suggestions below."
    };
  };

  const score = result?.matchScore || 0;
  const config = getScoreConfig(score);

  const tabs = [
    { id: "skills", label: "Missing Skills" },
    { id: "keywords", label: "Missing Keywords" },
    { id: "improve", label: "Resume Improvements" },
    { id: "topics", label: "Interview Topics" },
    { id: "questions", label: "Interview Questions" },
    ...(score > 80 ? [
      { id: "specializedJD", label: "Personalized JD" },
      { id: "coverLetter", label: "Cover Letter" },
      { id: "alignment", label: "Skill Alignment" }
    ] : [])
  ];

  const handleImproveResume = async () => {
    if (!selectedresume) {
      alert("Resume file is missing from selection.");
      return;
    }

    setIsImprovingAll(true);
    const formData = new FormData();
    formData.append("resume", selectedresume);
    formData.append("jobDescription", result?.jdText || ""); // Ensure JD text is passed
    formData.append("missingSkills", JSON.stringify(result?.missingSkills || []));
    formData.append("missingKeywords", JSON.stringify(result?.missingKeywords || []));

    try {
      const resp = await GlobalApi.FullAutoImprove(formData);
      const improvedData = resp.data;

      console.log("Improved Resume Data:", improvedData);

      localStorage.setItem("parsedResume", JSON.stringify(improvedData));
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Improve resume error:", err);
      const msg = err.response?.data?.message || "Failed to improve resume automatically.";
      alert(msg);
    } finally {
      setIsImprovingAll(false);
    }
  };

  const displayData = {
    skills: result?.missingSkills || [],
    keywords: result?.missingKeywords || [],
    improve: [...(result?.resumeImprovements || result?.suggestions || []), ...(result?.reach100Improvements || [])],
    topics: result?.interviewTopics || [],
    questions: result?.interviewQuestions || [],
    specializedJD: result?.specializedJD || "",
    coverLetter: result?.coverLetter || "",
    skillAlignment: result?.skillAlignment || []
  };

  return (
    <div className="max-w-6xl mt-14 bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 mx-auto transition">

      {/* Header */}
      <h3 className="text-3xl font-bold text-gray-900 mb-8">
        AI Analysis Result
      </h3>

      {/* ⭐ Modern Score Bar Layout */}
      <div className={`p-8 rounded-3xl border border-gray-100 shadow-sm mb-12 ${config.bg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${config.color.replace('from-', 'bg-').split(' ')[0]} text-white shadow-sm`}>
                {config.status}
              </span>
              <span className="text-2xl font-bold text-gray-900">{score}% Match</span>
            </div>
            <p className="text-gray-600 font-medium">
              {config.label}
            </p>
          </div>

          <div className="flex-1 max-w-md w-full">
            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full bg-gradient-to-r ${config.color} transition-all duration-1000 ease-out flex items-center justify-end pr-2`}
                style={{ width: `${score}%` }}
              >
                <div className="h-1.5 w-1.5 bg-white/50 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
              <span>Weak</span>
              <span>Solid</span>
              <span>Perfect</span>
            </div>
          </div>
        </div>
      </div>

      {/* Improve Resume Button */}
      <div className="mt-10 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Want to improve your resume automatically?
        </h3>

        <button
          onClick={() => handleImproveResume()}
          disabled={isImprovingAll}
          className={`px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow hover:bg-green-700 transition ${isImprovingAll ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isImprovingAll ? '✨ Improving Your Resume...' : 'Improve My Resume'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 justify-center my-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm 
              ${tab === t.id
                ? "bg-indigo-600 text-white shadow-md scale-105"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="border-t pt-6 mt-4">
        {tab === "skills" && (
          <div className="flex flex-wrap gap-3">
            {displayData.skills.length > 0 ? displayData.skills.map((skill, i) => (
              <span
                key={i}
                className="bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm shadow-sm"
              >
                {skill}
              </span>
            )) : <p className="text-gray-500 text-sm">No missing skills found.</p>}
          </div>
        )}

        {tab === "keywords" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayData.keywords.length > 0 ? displayData.keywords.map((kw, i) => (
              <div
                key={i}
                className="bg-yellow-50 border-l-4 border-yellow-500 p-3 text-sm text-yellow-800 rounded shadow-sm"
              >
                {kw}
              </div>
            )) : <p className="text-gray-500 text-sm">No missing keywords found.</p>}
          </div>
        )}

        {tab === "improve" && (
          <ul className="space-y-3">
            {displayData.improve.length > 0 ? displayData.improve.map((improve, i) => (
              <li key={i} className="flex gap-3 text-sm leading-6">
                <span className="text-green-600 text-lg">✔</span>
                <span className="text-gray-700">{improve}</span>
              </li>
            )) : <p className="text-gray-500 text-sm">No improvements suggested.</p>}
          </ul>
        )}

        {tab === "topics" && (
          <div className="flex flex-wrap gap-3">
            {displayData.topics.length > 0 ? displayData.topics.map((topic, i) => (
              <span
                key={i}
                className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm shadow-sm"
              >
                {topic}
              </span>
            )) : <p className="text-gray-500 text-sm">No specific topics identified.</p>}
          </div>
        )}

        {tab === "questions" && (
          <div className="space-y-4">
            {displayData.questions.length > 0 ? displayData.questions.map((q, i) => (
              <details
                key={i}
                className="p-5 bg-gray-50 rounded-xl border shadow-sm cursor-pointer transition hover:bg-gray-100"
              >
                <summary className="font-medium text-gray-900 text-sm">
                  Question {i + 1}
                </summary>
                <p className="mt-3 text-gray-700 text-sm leading-6">{q}</p>
              </details>
            )) : <p className="text-gray-500 text-sm">No interview questions generated.</p>}
          </div>
        )}

        {tab === "specializedJD" && (
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
            {displayData.specializedJD || "Not available."}
          </div>
        )}

        {tab === "coverLetter" && (
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap bg-green-50/50 p-8 rounded-2xl border border-green-100 shadow-inner">
            {displayData.coverLetter || "Not available."}
          </div>
        )}

        {tab === "alignment" && (
          <div className="space-y-4">
            {displayData.skillAlignment.length > 0 ? displayData.skillAlignment.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-white border rounded-xl shadow-sm">
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.alignment === 'high' ? 'bg-green-100 text-green-700' :
                  item.alignment === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {item.alignment}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{item.skill}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                </div>
              </div>
            )) : <p className="text-gray-500 text-sm">No alignment data available.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
