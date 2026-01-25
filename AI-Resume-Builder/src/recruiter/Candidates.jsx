import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalApi from 'service/GlobalApi';
import { Button } from '../components/ui/button';
import { Search, MapPin, Building2, User, Mail, Calendar, Trash2 } from 'lucide-react';
import CandidateDetailModal from './jobs/[id]/CandidateDetailModal';

function Candidates() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const resp = await GlobalApi.GetAllCandidates();
            setCandidates(resp.data);
        } catch (err) {
            console.error('Failed to fetch candidates', err);
            if (err.response?.status === 401) navigate('/auth/sign-in');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this candidate?')) {
            try {
                await GlobalApi.DeleteCandidate(id);
                setCandidates(candidates.filter(c => c._id !== id));
            } catch (err) {
                alert('Failed to delete candidate');
            }
        }
    };

    const openDetails = (candidate) => {
        setSelectedCandidate(candidate);
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading all candidates...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">All Candidates</h1>
                <p className="text-gray-600">View and manage all candidates across all your job openings.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email or job..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                <th className="px-6 py-4">Candidate</th>
                                <th className="px-6 py-4">Applied For</th>
                                <th className="px-6 py-4">Score</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {candidates.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No candidates found. Screen some resumes to see them here.
                                    </td>
                                </tr>
                            ) : candidates.map((cand) => (
                                <tr key={cand._id} className="hover:bg-gray-50 transition group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                                {cand.candidateName[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{cand.candidateName}</div>
                                                <div className="text-xs text-gray-500">{cand.candidateEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-indigo-600">{cand.jobId?.title || 'Unknown Job'}</div>
                                        <div className="text-xs text-gray-500">{cand.jobId?.company}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-bold ${cand.score > 75 ? 'text-green-600' : cand.score > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {cand.score}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(cand.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openDetails(cand)}>
                                                Details
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 border-gray-200"
                                                onClick={() => handleDelete(cand._id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
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

export default Candidates;
