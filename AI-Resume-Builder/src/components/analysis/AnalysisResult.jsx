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
    <div className="max-w-6xl mt-14 bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-gray-200 mx-auto transition-all duration-500 relative overflow-hidden">

      {/* Premium Top Accent */}
      <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${config.color}`} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h3 className="text-4xl font-black text-gray-900 tracking-tight">
            AI Analysis <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Result</span>
          </h3>
          <p className="text-gray-500 font-medium mt-1">Deep-scan match report for your resume</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Analysis</span>
        </div>
      </div>

      {/* ⭐ Modern Score Bar Layout */}
      <div className={`p-10 rounded-[2rem] border-2 border-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] mb-12 relative overflow-hidden ${config.bg}`}>
        {/* Subtle Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${config.color.replace('from-', 'bg-').split(' ')[0]} text-white shadow-lg`}>
                {config.status}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-gray-900 leading-none">{score}</span>
                <span className="text-xl font-bold text-gray-400">%</span>
              </div>
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">Match Rating</h4>
            <p className="text-gray-600 font-medium max-w-md leading-relaxed">
              {config.label}
            </p>
          </div>

          <div className="flex-1 w-full lg:max-w-lg">
            <div className="mb-4 flex justify-between items-end">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">Optimization Progress</span>
              <span className={`text-xs font-black ${config.text}`}>{score}/100</span>
            </div>
            <div className="h-6 w-full bg-white/50 rounded-full p-1 shadow-inner border border-white/80">
              <div
                className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3 shadow-lg`}
                style={{ width: `${score}%` }}
              >
                <div className="h-2 w-2 bg-white rounded-full animate-ping" />
              </div>
            </div>
            <div className="flex justify-between mt-3 px-1">
              {['Entry', 'Intermediate', 'Advanced', 'Expert'].map((l, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`h-1.5 w-0.5 mb-1 ${score >= (i * 25) ? 'bg-indigo-400' : 'bg-gray-300'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${score >= (i * 25) ? 'text-indigo-600' : 'text-gray-400'}`}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Improve Resume Action Card */}
      <div className="mt-8 mb-12 p-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-indigo-500/30 transition-all duration-700" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2 italic">
              Ready to hit <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">100%?</span>
            </h3>
            <p className="text-indigo-200/80 font-medium">Auto-align your resume with this JD in one click.</p>
          </div>

          <button
            onClick={() => handleImproveResume()}
            disabled={isImprovingAll}
            className={`group relative px-8 py-4 bg-white text-indigo-900 font-black rounded-2xl shadow-2xl hover:bg-emerald-50 transition-all duration-300 transform hover:scale-105 active:scale-95 space-x-2 flex items-center ${isImprovingAll ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isImprovingAll ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" />
                Improving...
              </span>
            ) : (
              <>
                <span>Improve Resume</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-10 p-2 bg-gray-100/80 rounded-[1.5rem] border border-gray-200/50">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
              ${tab === t.id
                ? "bg-white text-indigo-700 shadow-md scale-100 border border-indigo-100"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Interactive Content Area */}
      <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100 shadow-inner min-h-[300px]">
        {tab === "skills" && (
          <div className="flex flex-wrap gap-3">
            {displayData.skills.length > 0 ? displayData.skills.map((skill, i) => (
              <span
                key={i}
                className="bg-white text-red-700 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider shadow-sm border border-red-100 hover:border-red-300 transition-colors"
              >
                {skill}
              </span>
            )) : <p className="text-gray-400 text-sm italic font-medium">No missing skills found.</p>}
          </div>
        )}

        {tab === "keywords" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayData.keywords.length > 0 ? displayData.keywords.map((kw, i) => (
              <div
                key={i}
                className="bg-white border-l-4 border-yellow-500 p-5 text-sm font-semibold text-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                {kw}
              </div>
            )) : <p className="text-gray-400 text-sm italic font-medium">No missing keywords found.</p>}
          </div>
        )}

        {tab === "improve" && (
          <div className="space-y-4">
            {displayData.improve.length > 0 ? displayData.improve.map((improve, i) => (
              <div key={i} className="group flex gap-5 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-emerald-600 font-bold text-xs">✔</span>
                </div>
                <span className="text-gray-700 font-medium text-sm leading-relaxed self-center">{improve}</span>
              </div>
            )) : <p className="text-gray-400 text-sm italic font-medium">No improvements suggested.</p>}
          </div>
        )}

        {tab === "topics" && (
          <div className="flex flex-wrap gap-3">
            {displayData.topics.length > 0 ? displayData.topics.map((topic, i) => (
              <span
                key={i}
                className="bg-white text-blue-700 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider shadow-sm border border-blue-100 hover:border-blue-300 transition-colors"
              >
                {topic}
              </span>
            )) : <p className="text-gray-400 text-sm italic font-medium">No specific topics identified.</p>}
          </div>
        )}

        {tab === "questions" && (
          <div className="space-y-4">
            {displayData.questions.length > 0 ? displayData.questions.map((q, i) => (
              <details
                key={i}
                className="group p-6 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm transition-all hover:border-indigo-200"
              >
                <summary className="font-bold text-gray-800 text-sm cursor-pointer list-none flex justify-between items-center outline-none">
                  <span className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase">Q{i + 1}</span>
                    {q.split('?')[0]}?
                  </span>
                  <span className="text-indigo-400 group-open:rotate-180 transition-transform tracking-widest">+</span>
                </summary>
                <div className="mt-5 pt-5 border-t border-gray-50 text-gray-600 text-sm leading-relaxed font-medium">
                  {q.split('?')[1] || "Preparation recommended for this topic."}
                </div>
              </details>
            )) : <p className="text-gray-400 text-sm italic font-medium">No interview questions generated.</p>}
          </div>
        )}

        {tab === "specializedJD" && (
          <div className="text-gray-700 whitespace-pre-wrap bg-white p-8 rounded-[2rem] border border-blue-100 shadow-sm leading-relaxed font-medium text-sm">
            {displayData.specializedJD || "Not available."}
          </div>
        )}

        {tab === "coverLetter" && (
          <div className="text-gray-700 whitespace-pre-wrap bg-white p-10 rounded-[2.5rem] border border-green-100 shadow-lg leading-relaxed font-medium text-sm relative">
            <div className="absolute top-6 right-8 text-[10px] font-black text-emerald-600 uppercase tracking-widest opacity-30">Draft Version</div>
            {displayData.coverLetter || "Not available."}
          </div>
        )}

        {tab === "alignment" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayData.skillAlignment.length > 0 ? displayData.skillAlignment.map((item, i) => (
              <div key={i} className="flex flex-col gap-4 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <p className="font-black text-gray-900 uppercase text-[11px] tracking-wider">{item.skill}</p>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${item.alignment === 'high' ? 'bg-emerald-100 text-emerald-700' :
                    item.alignment === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {item.alignment}
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">{item.reason}</p>
              </div>
            )) : <p className="text-gray-400 text-sm italic font-medium">No alignment data available.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
