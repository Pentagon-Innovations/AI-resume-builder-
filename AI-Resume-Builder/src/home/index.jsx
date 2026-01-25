"use client";

import Header from "@/components/custom/Header";
import AnalysisResult from "@/components/analysis/AnalysisResult";
import { useState } from "react";
import GlobalApi from "service/GlobalApi";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFetchingJD, setIsFetchingJD] = useState(false);
  const [result, setResult] = useState(null);
  const [structuredJD, setStructuredJD] = useState(null);

  const handleFetchJD = async () => {
    const urlToFetch = jobUrl || (jobDescription.startsWith("http") ? jobDescription : "");
    if (!urlToFetch) {
      alert("Please enter a valid LinkedIn or Job URL.");
      return;
    }

    setIsFetchingJD(true);
    try {
      const resp = await GlobalApi.GenerateJD({ jobUrl: urlToFetch });
      const data = resp.data;

      if (data.error) {
        alert(data.error);
        return;
      }
      setStructuredJD(data);
      if (data.fullDescription) {
        setJobDescription(data.fullDescription);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsFetchingJD(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || (!jobDescription && !jobUrl)) {
      alert("Please upload a resume and add job description or URL.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("resume", selectedFile);
    formData.append("jobDescription", jobDescription);
    // Use jobUrl state or check if description is a URL
    const finalJobUrl = jobUrl || (jobDescription.startsWith("http") ? jobDescription : "");
    formData.append("jobUrl", finalJobUrl);

    try {
      const resp = await GlobalApi.AnalyzeResume(formData);
      const data = resp.data;

      if (data.error) {
        alert(data.error + (data.details ? `\n\nDetails: ${data.details}` : ""));
        return;
      }
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.message || "Analysis failed. Check your connection or quota.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />

      {/* Main Container */}
      <section className="w-full flex flex-col items-center mt-14 px-4">
        <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Upload Resume */}
          <div className="border border-[#D5DCE6] border-dashed rounded-2xl bg-white p-10 shadow-sm hover:shadow-md transition relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Upload Resume</h2>
              <span className="text-xs px-3 py-1 rounded-md bg-purple-100 text-purple-700 font-medium">
                Quota: 2/5
              </span>
            </div>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              id="resume-upload"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />

            <label
              htmlFor="resume-upload"
              className="flex flex-col items-center justify-center h-64 
                        border-2 border-dashed border-[#C8D0DA] 
                        rounded-2xl cursor-pointer hover:bg-gray-50 transition"
            >
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-50 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#6366F1"
                  className="w-10 h-10"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V3m0 0L7.5 7.5M12 3l4.5 4.5M19.5 10.5v7.125A2.625 2.625 0 0116.875 20.25H7.125A2.625 2.625 0 014.5 17.625V10.5"
                  />
                </svg>
              </div>

              <p className="text-lg font-medium text-gray-800">
                {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-gray-400 mt-1">PDF or DOCX only</p>
            </label>
          </div>

          {/* Job Description */}
          <div className="border rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Job Description</h2>
              {(jobUrl || jobDescription.startsWith("http")) && (
                <button
                  onClick={handleFetchJD}
                  disabled={isFetchingJD}
                  className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-bold"
                >
                  {isFetchingJD ? "Fetching..." : "✨ Fetch & Structure"}
                </button>
              )}
            </div>

            <textarea
              className="w-full h-56 rounded-xl bg-[#0F172A] text-gray-200 p-4 text-sm resize-none outline-none border border-gray-700 shadow-inner"
              placeholder="Paste JD here or Paste LinkedIn URL below..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />

            <input
              type="text"
              className="mt-5 w-full p-4 rounded-xl border bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm transition"
              placeholder="Paste LinkedIn Job URL here (optional)"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
            />

            {structuredJD && (structuredJD.role !== 'Unknown Role' || structuredJD.company !== 'Unknown Company') && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 text-xs text-green-800 shadow-sm animate-pulse">
                <span className="font-bold">✨ Success:</span> Parsed {structuredJD.role} {structuredJD.company && structuredJD.company !== 'Unknown Company' ? `at ${structuredJD.company}` : ""}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-7xl w-full mt-10 flex flex-col items-center">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`px-12 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition transform hover:scale-105 active:scale-95 text-lg ${loading ? "opacity-70" : ""}`}
          >
            {loading ? "🔍 Analyzing Match..." : "Analyze Match →"}
          </button>
          <p className="text-gray-500 text-sm mt-4 font-medium">Ready to analyze? 3 uploads remaining today.</p>
        </div>
      </section>

      {/* Result Component */}
      <div className="flex justify-center mt-12">
        {result && <AnalysisResult result={result} selectedresume={selectedFile} />}
      </div>
    </div>
  );
}
