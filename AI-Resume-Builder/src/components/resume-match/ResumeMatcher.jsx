import React, { useState, useRef } from "react";
import GlobalApi from "service/GlobalApi";

export default function ResumeMatcher() {
  const localFilePath = "/mnt/data/Koteeswaran_Ramachandran_Modern_CV.docx";

  const [file, setFile] = useState(null);
  const [useLocalFile, setUseLocalFile] = useState(false);
  const [jdText, setJdText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingJD, setIsFetchingJD] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [structuredJD, setStructuredJD] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef();

  // Drag/drop handlers
  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) setFile(f);
  }
  function handleDragOver(e) { e.preventDefault(); }

  function onFileChange(e) {
    const f = e.target.files[0];
    if (f) setFile(f);
  }

  async function handleFetchJD() {
    if (!jdText.startsWith("http")) {
      setError("Please paste a valid URL to fetch.");
      return;
    }
    setError(null);
    setIsFetchingJD(true);
    try {
      const resp = await GlobalApi.GenerateJD({ jobUrl: jdText });
      const data = resp.data;
      setStructuredJD(data);
      if (data.fullDescription) {
        setJdText(data.fullDescription);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFetchingJD(false);
    }
  }

  async function handleAnalyze() {
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      let resp;
      if (useLocalFile) {
        // Note: The backend 'analyze' currently expects a real file or JD. 
        // Local file path testing might need backend support if not already there.
        resp = await GlobalApi.AnalyzeResume({
          localFilePath,
          jobDescription: jdText
        });
      } else {
        if (!file) {
          setError("Please upload a resume or choose 'Use local file' toggle.");
          setIsLoading(false);
          return;
        }
        const form = new FormData();
        form.append("resume", file);
        form.append("jobDescription", jdText);
        if (jdText.startsWith("http")) {
          form.append("jobUrl", jdText);
        }
        resp = await GlobalApi.AnalyzeResume(form);
      }

      setResult(resp.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleParseAndEdit() {
    if (!file) {
      setError("Please upload a resume first.");
      return;
    }
    setError(null);
    setIsParsing(true);

    try {
      const form = new FormData();
      form.append("resume", file);

      const resp = await GlobalApi.ParseResume(form);
      const parsedData = resp.data;
      console.log("Parsed Resume Data:", parsedData);

      // Store in session or local storage for the editor
      localStorage.setItem("parsedResume", JSON.stringify(parsedData));

      // Redirect to a new resume creation page or editor
      // For this demo, we'll alert and log
      window.location.href = "/dashboard"; // Redirecting to dashboard where they can see 'Add Resume'
    } catch (err) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  }

  function clearAll() {
    setFile(null);
    setUseLocalFile(false);
    setJdText("");
    setResult(null);
    setError(null);
    setStructuredJD(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Resume */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-semibold text-gray-800">Upload Resume</h3>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">Analysis Tool</span>
          </div>

          <p className="text-sm text-gray-500 mt-2">Supported formats: PDF, DOCX (Max 5MB)</p>

          <div
            className="border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-colors rounded-xl mt-4 p-8 flex flex-col items-center justify-center cursor-pointer bg-gray-50"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            aria-hidden
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              ref={fileInputRef}
              onChange={onFileChange}
            />
            <svg className="w-12 h-12 text-indigo-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3v10" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-sm font-medium text-gray-600">Click to upload or drag and drop</div>
            <div className="text-xs text-gray-400 mt-1 uppercase">PDF or DOCX only</div>
            {file && <div className="mt-4 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">Selected: {file.name}</div>}

            <label className="mt-5 inline-flex items-center text-sm cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2 cursor-pointer"
                checked={useLocalFile}
                onChange={(e) => setUseLocalFile(e.target.checked)}
              />
              <span className="text-gray-600 group-hover:text-indigo-600 transition-colors">Use demo resume (fast test)</span>
            </label>
          </div>
        </div>

        {/* Job description */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xl font-semibold text-gray-800">Job Description</h3>
            {jdText.startsWith("http") && (
              <button
                onClick={handleFetchJD}
                disabled={isFetchingJD}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm font-medium"
              >
                {isFetchingJD ? "Fetching..." : "✨ Fetch & Structure"}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">Paste the LinkedIn job URL or full job description text below.</p>

          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste Job URL or Job Description here..."
            className="flex-grow w-full min-h-[220px] rounded-xl bg-gray-900 text-gray-200 p-4 resize-none font-mono text-sm border-0 focus:ring-2 focus:ring-indigo-500 shadow-inner"
          />

          {structuredJD && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100 text-xs text-green-800">
              <span className="font-bold">Successfully Parsed:</span> {structuredJD.role} at {structuredJD.company}
            </div>
          )}
        </div>
      </div>

      {/* bottom bar */}
      <div className="mt-6 bg-white rounded-xl p-4 shadow-md flex items-center justify-between border border-gray-100">
        <div className="text-sm text-gray-500 font-medium">✨ Ready to optimize your workflow? </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={clearAll}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm"
          >
            Clear All
          </button>

          <button
            onClick={handleAnalyze}
            className={`px-8 py-3 rounded-lg text-white font-bold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-indigo-200 transition-all ${isLoading ? "opacity-70 scale-95" : "hover:-translate-y-0.5"}`}
            disabled={isLoading}
          >
            {isLoading ? "🔍 Analyzing..." : "Analyze Match →"}
          </button>

          <button
            onClick={handleParseAndEdit}
            className={`px-6 py-3 rounded-lg text-indigo-600 border border-indigo-200 font-bold text-sm bg-white hover:bg-indigo-50 transition-all ${isParsing ? "opacity-70" : ""}`}
            disabled={isParsing || isLoading}
          >
            {isParsing ? "⚙️ Parsing..." : "Edit Resume with AI"}
          </button>
        </div>
      </div>

      {/* results */}
      <div className="mt-8 transition-all duration-500">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-6">
              <h3 className="text-2xl font-bold text-gray-800">Resume Matching Score</h3>
              <div className="flex items-center gap-3">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${result.matchScore >= 80 ? 'border-green-500 text-green-600' : result.matchScore >= 50 ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'}`}>
                  <span className="text-2xl font-black">{Math.round(result.matchScore)}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                <section>
                  <h4 className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-2 text-[10px]">!</span>
                    Missing Skills & Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[...(result.missingSkills || []), ...(result.missingKeywords || [])].map((s, idx) => (
                      <span key={idx} className="bg-red-50 text-red-700 px-3 py-1 rounded-md text-xs font-bold border border-red-100 uppercase tracking-tighter transition-all hover:bg-red-100">{s}</span>
                    ))}
                    {(!result.missingSkills?.length && !result.missingKeywords?.length) && <div className="text-sm text-green-600 font-medium">None — exceptional match!</div>}
                  </div>
                </section>

                <section>
                  <h4 className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-[10px]">?</span>
                    Recommended Improvements
                  </h4>
                  <ul className="space-y-3">
                    {(result.resumeImprovements || result.suggestions || []).map((s, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-3 shrink-0 group-hover:scale-150 transition-transform"></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Right Column */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h4 className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-[10px]">#</span>
                  Interview Prep Guide
                </h4>

                <div className="space-y-6">
                  {(result.interviewTopics || result.interviewPrep || []).map((topic, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-xs font-black text-indigo-600 uppercase mb-2">Topic: {topic.topic || topic.name}</div>
                      <ul className="space-y-3">
                        {(topic.questions || []).map((q, j) => (
                          <li key={j} className="text-sm text-gray-700 leading-relaxed italic border-l-2 border-indigo-100 pl-3">"{q}"</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {result.interviewQuestions && !result.interviewTopics && (
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="text-xs font-black text-indigo-600 uppercase mb-2">General Interview Questions</div>
                      <ul className="space-y-3">
                        {result.interviewQuestions.map((q, j) => (
                          <li key={j} className="text-sm text-gray-700 leading-relaxed italic border-l-2 border-indigo-100 pl-3">"{q}"</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
