import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from '@/components/ui/button'
import { HiCheck, HiExclamationTriangle, HiUser, HiEnvelope, HiCalendarDays, HiPhone, HiMapPin, HiBriefcase, HiDocumentText, HiArrowDownOnSquare, HiArrowTopRightOnSquare, HiGlobeAlt, HiSquares2X2, HiMagnifyingGlass, HiStar, HiChatBubbleLeft, HiClock, HiShieldCheck, HiViewfinderCircle, HiTrophy, HiQuestionMarkCircle, HiLightBulb, HiPencil, HiXMark } from "react-icons/hi2"
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] border-gray-200 shadow-2xl">
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
                                    <button onClick={handleSaveName} className="p-1 text-green-600 hover:bg-green-50 rounded"><HiCheck className="w-5 h-5" /></button>
                                    <button onClick={() => setIsEditing(false)} className="p-1 text-red-600 hover:bg-red-50 rounded"><HiXMark className="w-5 h-5" /></button>
                                </div>
                            ) : (
                                <div className="group flex items-center gap-2">
                                    <DialogTitle className="text-2xl font-bold text-gray-900">{candidate.candidateName}</DialogTitle>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <HiPencil className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <DialogDescription>{candidate.candidateEmail}</DialogDescription>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="flex flex-col items-end">
                                <div className={`text-4xl font-black ${candidate.score > 75 ? 'text-green-600' : candidate.score > 50 ? 'text-indigo-600' : 'text-red-500'}`}>
                                    {candidate.score}%
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Match Index</div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-8 py-6 custom-scrollbar">
                    {/* Enhanced Progress Bar Center */}
                    <div className={`p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden ${candidate.score > 75 ? 'bg-green-50' : candidate.score > 50 ? 'bg-indigo-50' : 'bg-red-50'}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1 text-center md:text-left">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${candidate.score > 75 ? 'bg-white text-green-700 border-green-100' : candidate.score > 50 ? 'bg-white text-indigo-700 border-indigo-100' : 'bg-white text-red-700 border-red-100'} shadow-sm mb-3 inline-block`}>
                                    {candidate.score > 75 ? 'Excellent Match' : candidate.score > 50 ? 'Good Match' : 'Weak Match'}
                                </span>
                                <h4 className="text-xl font-bold text-gray-900 leading-tight">Match Quality Analysis</h4>
                            </div>

                            <div className="w-full md:w-64">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Score Density</span>
                                    <span className={`text-sm font-black ${candidate.score > 75 ? 'text-green-600' : candidate.score > 50 ? 'text-indigo-600' : 'text-red-500'}`}>{candidate.score}%</span>
                                </div>
                                <div className="h-4 w-full bg-white rounded-full p-0.5 shadow-inner border border-gray-100">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out rounded-full bg-gradient-to-r ${candidate.score > 75 ? 'from-emerald-400 to-green-600' : candidate.score > 50 ? 'from-blue-400 to-indigo-600' : 'from-orange-400 to-red-600'}`}
                                        style={{ width: `${candidate.score}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Missing Skills */}
                        <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <h4 className="flex items-center text-xs font-black text-gray-900 uppercase tracking-widest">
                                <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center mr-3">
                                    <HiExclamationTriangle className="w-4 h-4 text-red-500" />
                                </div>
                                Missing Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {candidate.missingSkills?.length > 0 ? (
                                    candidate.missingSkills.map((skill, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-xl border border-red-100">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic">No missing skills detected.</span>
                                )}
                            </div>
                        </div>

                        {/* Missing Keywords */}
                        <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <h4 className="flex items-center text-xs font-black text-gray-900 uppercase tracking-widest">
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center mr-3">
                                    <HiCheck className="w-4 h-4 text-indigo-500" />
                                </div>
                                Missing Keywords
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {candidate.missingKeywords?.length > 0 ? (
                                    candidate.missingKeywords.map((kw, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-xl border border-indigo-100">
                                            {kw}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic">No missing keywords detected.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Match Analysis / Improvements */}
                    <div className="space-y-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-inner">
                        <h4 className="flex items-center text-xs font-black text-gray-900 uppercase tracking-widest">
                            <div className="w-6 h-6 rounded-lg bg-yellow-50 flex items-center justify-center mr-3">
                                <HiLightBulb className="w-4 h-4 text-yellow-600" />
                            </div>
                            AI Strategic Analysis
                        </h4>
                        <div className="text-sm text-gray-600 leading-relaxed font-medium bg-white p-5 rounded-xl border border-gray-50 shadow-sm whitespace-pre-line">
                            {candidate.matchAnalysis || "No detailed analysis available."}
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
