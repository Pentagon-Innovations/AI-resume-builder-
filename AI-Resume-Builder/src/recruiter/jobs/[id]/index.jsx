import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GlobalApi from 'service/GlobalApi';
import { Button } from '@/components/ui/button';
import { Input } from "../../../components/ui/input";
import {
    ArrowLeft,
    Upload,
    FileText,
    CheckCircle2,
    XCircle,
    Loader2,
    Search,
    Filter,
    Download
} from 'lucide-react';
import CandidateDetailModal from './CandidateDetailModal';

function JobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [screening, setScreening] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef();

    useEffect(() => {
        fetchJobAndCandidates();
    }, [id]);

    const fetchJobAndCandidates = async () => {
        try {
            const [jobResp, candResp] = await Promise.all([
                GlobalApi.GetJobById(id),
                GlobalApi.GetRankedCandidates(id)
            ]);
            setJob(jobResp.data);
            setCandidates(candResp.data);
        } catch (err) {
            console.error('Failed to fetch data', err);
            if (err.response?.status === 401) navigate('/auth/sign-in');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        setScreening(true);
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('resumes', file);
        });

        try {
            await GlobalApi.ScreenResumes(id, formData);
            fetchJobAndCandidates();
        } catch (err) {
            console.error('Screening failed', err);
            if (err.response?.status === 401) {
                navigate('/auth/sign-in');
            } else {
                alert('Screening failed. Please check your API key and connection.');
            }
        } finally {
            setScreening(false);
        }
    };

    const openCandidateDetails = (candidate) => {
        setSelectedCandidate(candidate);
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <button onClick={() => navigate('/recruiter/jobs')} className="flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Jobs
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{job?.title}</h1>
                    <p className="text-gray-600">{job?.company} • {job?.location}</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        multiple
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf,.docx,.txt"
                    />
                    <Button
                        onClick={() => fileInputRef.current.click()}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        disabled={screening}
                    >
                        {screening ? <Loader2 className="animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Bulk Upload Resumes
                    </Button>
                    <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        onClick={async () => {
                            if (window.confirm('Delete this job? All data will be lost.')) {
                                try {
                                    await GlobalApi.DeleteJob(id);
                                    navigate('/recruiter/jobs');
                                } catch (err) {
                                    alert('Failed to delete job');
                                }
                            }
                        }}
                    >
                        Delete Job
                    </Button>
                </div>
            </div>

            {/* Candidate Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Ranked Candidates ({candidates.length})</h3>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Filter candidates..." className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                <th className="px-6 py-4">Candidate Name</th>
                                <th className="px-6 py-4">Match Score</th>
                                <th className="px-6 py-4">Missing Skills</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {candidates.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        No candidates screened yet. Upload resumes to start ranking.
                                    </td>
                                </tr>
                            ) : candidates.map(cand => (
                                <tr key={cand._id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-900">{cand.candidateName}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h - full ${cand.score > 75 ? 'bg-green-500' : cand.score > 50 ? 'bg-yellow-500' : 'bg-red-500'} `}
                                                    style={{ width: `${cand.score}% ` }}
                                                />
                                            </div>
                                            <span className="font-bold">{cand.score}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {cand.missingSkills.slice(0, 3).map((skill, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">{skill}</span>
                                            ))}
                                            {cand.missingSkills.length > 3 && <span className="text-xs text-gray-400">+{cand.missingSkills.length - 3} more</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300"
                                                onClick={() => openCandidateDetails(cand)}
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-gray-200 text-gray-500 hover:border-red-600 hover:text-red-600"
                                                onClick={async () => {
                                                    if (window.confirm(`Remove candidate ${cand.candidateName}?`)) {
                                                        try {
                                                            await GlobalApi.DeleteCandidate(cand._id);
                                                            setCandidates(candidates.filter(c => c._id !== cand._id));
                                                        } catch (err) {
                                                            alert('Failed to remove candidate');
                                                        }
                                                    }
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CandidateDetailModal
                candidate={selectedCandidate}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={(updatedCand) => {
                    setCandidates(candidates.map(c => c._id === updatedCand._id ? updatedCand : c));
                    setSelectedCandidate(updatedCand);
                }}
            />
        </div>
    );
}

export default JobDetails;
