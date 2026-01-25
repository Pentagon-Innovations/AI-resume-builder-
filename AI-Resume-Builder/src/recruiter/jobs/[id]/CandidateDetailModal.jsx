import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../../components/ui/dialog";
import { CheckCircle2, AlertCircle, HelpCircle, Lightbulb, Edit2, Check, X } from 'lucide-react';
import GlobalApi from 'service/GlobalApi';

function CandidateDetailModal({ candidate, isOpen, onClose, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');

    useEffect(() => {
        if (candidate) setEditedName(candidate.candidateName);
    }, [candidate]);

    if (!candidate) return null;

    const handleSaveName = async () => {
        try {
            await GlobalApi.UpdateCandidate(candidate._id, { candidateName: editedName });
            setIsEditing(false);
            if (onUpdate) onUpdate({ ...candidate, candidateName: editedName });
        } catch (err) {
            alert('Failed to update name');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-8">
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        className="text-2xl font-bold text-gray-900 border-b border-indigo-600 focus:outline-none bg-transparent w-full"
                                        autoFocus
                                    />
                                    <button onClick={handleSaveName} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-5 h-5" /></button>
                                    <button onClick={() => setIsEditing(false)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-5 h-5" /></button>
                                </div>
                            ) : (
                                <div className="group flex items-center gap-2">
                                    <DialogTitle className="text-2xl font-bold text-gray-900">{candidate.candidateName}</DialogTitle>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <DialogDescription>{candidate.candidateEmail}</DialogDescription>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-3xl font-bold text-indigo-600">{candidate.score}%</div>
                            <div className="text-xs text-gray-500 font-medium tracking-wider uppercase">Match Score</div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 custom-scrollbar">
                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${candidate.score > 75 ? 'bg-green-500' : candidate.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${candidate.score}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Missing Skills */}
                        <div className="space-y-3">
                            <h4 className="flex items-center text-sm font-semibold text-gray-900">
                                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                                Missing Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {candidate.missingSkills?.length > 0 ? (
                                    candidate.missingSkills.map((skill, i) => (
                                        <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-md border border-red-100">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-500 italic">No missing skills detected.</span>
                                )}
                            </div>
                        </div>

                        {/* Missing Keywords */}
                        <div className="space-y-3">
                            <h4 className="flex items-center text-sm font-semibold text-gray-900">
                                <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-500" />
                                Missing Keywords
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {candidate.missingKeywords?.length > 0 ? (
                                    candidate.missingKeywords.map((kw, i) => (
                                        <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md border border-indigo-100">
                                            {kw}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-500 italic">No missing keywords detected.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Match Analysis / Improvements */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h4 className="flex items-center text-sm font-semibold text-gray-900">
                            <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" />
                            AI Match Analysis & Improvements
                        </h4>
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            {candidate.matchAnalysis || "No detailed analysis available."}
                        </div>
                    </div>

                    {/* Interview Questions */}
                    <div className="space-y-3">
                        <h4 className="flex items-center text-sm font-semibold text-gray-900">
                            <HelpCircle className="w-4 h-4 mr-2 text-green-600" />
                            Recommended Interview Questions
                        </h4>
                        <div className="space-y-2">
                            {candidate.interviewQuestions?.length > 0 ? (
                                candidate.interviewQuestions.map((q, i) => (
                                    <div key={i} className="p-3 bg-white border border-gray-100 rounded-lg text-sm text-gray-700 shadow-sm">
                                        <span className="font-bold text-indigo-600 mr-2">Q{i + 1}:</span> {q}
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 italic">No specific interview questions generated.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3 bg-white">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
                    >
                        Close Details
                    </button>
                    <button
                        className="px-6 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                        onClick={() => window.print()}
                    >
                        Print Report
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default CandidateDetailModal;
