import { HiArrowPath, HiPlus, HiDocumentPlus, HiSparkles } from "react-icons/hi2"
import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { v4 as uuidv4 } from 'uuid';
import GlobalApi from 'service/GlobalApi'
import { useAuth } from './../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Textarea } from "@/components/ui/textarea"

function AddResume() {

    const [openDialog, setOpenDialog] = useState(false)
    const [resumeTitle, setResumeTitle] = useState();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const navigation = useNavigate();
    const [activeTab, setActiveTab] = useState('empty');

    // Autofill State
    const [jobDescription, setJobDescription] = useState('');
    const [file, setFile] = useState(null);

    const onCreate = async () => {
        setLoading(true)
        const uuid = uuidv4();
        const data = {
            title: resumeTitle,
            resumeId: uuid,
            userEmail: user?.email,
            userName: user?.firstName + ' ' + (user?.lastName || '')
        }

        GlobalApi.CreateNewResume(data).then(resp => {
            console.log(resp.data._id);
            if (resp) {
                setLoading(false);
                navigation('/dashboard/resume/' + resp.data._id + "/edit");
            }
        }, () => {
            setLoading(false);
        })
    }

    const onAutofill = async () => {
        if (!file || !jobDescription) return;

        // File size check (4MB limit for Vercel serverless)
        if (file.size > 4 * 1024 * 1024) {
            alert("File is too large. Please upload a file smaller than 4MB.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobDescription', jobDescription);

        try {
            const resp = await GlobalApi.AutofillResume(formData);

            // Check for error response
            if (resp.data?.error) {
                throw new Error(resp.data.details || resp.data.error);
            }

            if (resp.data) {
                // Once we have the parsed data, create the resume
                const uuid = uuidv4();
                const payload = {
                    title: `Autofilled - ${new Date().toLocaleDateString()} `,
                    resumeId: uuid,
                    userEmail: user?.email,
                    userName: user?.firstName + ' ' + (user?.lastName || ''),
                    ...resp.data // Spread the AI-generated content
                };

                const createResp = await GlobalApi.CreateNewResume(payload);
                if (createResp) {
                    setLoading(false);
                    setOpenDialog(false);
                    navigation('/dashboard/resume/' + createResp.data._id + '/edit');
                }
            }
        } catch (error) {
            console.error('Autofill error:', error);
            setLoading(false);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to autofill resume. Please try again.';
            alert(errorMessage);
        }
    };

    return (
        <div >
            <div className='p-14 py-24 border 
        items-center flex 
        justify-center bg-secondary
        rounded-lg h-[280px]
        hover:scale-105 transition-all hover:shadow-md
        cursor-pointer border-dashed'
                onClick={() => setOpenDialog(true)}
            >
                <HiPlus className="w-8 h-8 text-gray-400" />
            </div>

            <Dialog open={openDialog} onOpenChange={(open) => {
                setOpenDialog(open);
                if (!open) {
                    setActiveTab('empty');
                    setResumeTitle('');
                    setJobDescription('');
                    setFile(null);
                }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Create New Resume</DialogTitle>
                        <DialogDescription>
                            Choose your preferred method to start creating your resume.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="w-full mt-4">
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div
                                className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-2 hover:border-primary
                                ${activeTab === 'empty' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-slate-50 border-gray-200 hover:bg-slate-100'}`}
                                onClick={() => setActiveTab('empty')}
                            >
                                <HiDocumentPlus className={`w-8 h-8 ${activeTab === 'empty' ? 'text-primary' : 'text-gray-400'}`} />
                                <span className={`text-sm font-semibold ${activeTab === 'empty' ? 'text-primary' : 'text-gray-600'}`}>Start From Scratch</span>
                            </div>
                            <div
                                className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-2 hover:border-primary
                                ${activeTab === 'autofill' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-slate-50 border-gray-200 hover:bg-slate-100'}`}
                                onClick={() => setActiveTab('autofill')}
                            >
                                <HiSparkles className={`w-8 h-8 ${activeTab === 'autofill' ? 'text-primary' : 'text-gray-400'}`} />
                                <span className={`text-sm font-semibold ${activeTab === 'autofill' ? 'text-primary' : 'text-gray-600'}`}>Autofill with AI</span>
                            </div>
                        </div>

                        {/* Empty Resume Tab */}
                        {activeTab === 'empty' ? (
                            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                                <label className="text-sm font-medium text-slate-700">Resume Title</label>
                                <Input
                                    placeholder="e.g. Full Stack Developer Resume"
                                    onChange={(e) => setResumeTitle(e.target.value)}
                                    className="focus-visible:ring-primary"
                                />
                                <div className='flex justify-end gap-3 mt-4'>
                                    <Button onClick={() => setOpenDialog(false)} variant="outline">Cancel</Button>
                                    <Button
                                        disabled={!resumeTitle || loading}
                                        onClick={() => onCreate()}>
                                        {loading ? <HiArrowPath className='animate-spin' /> : 'Create'}
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        {/* Autofill Tab */}
                        {activeTab === 'autofill' ? (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Upload Current Resume (PDF/DOCX)</label>
                                    <Input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.docx,.txt" className="cursor-pointer file:text-primary file:font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Target Job Description</label>
                                    <Textarea
                                        placeholder="Paste the job description here for tailored results..."
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        className="h-24 resize-none focus-visible:ring-primary"
                                    />
                                </div>
                                <div className='flex justify-end gap-3 mt-4'>
                                    <Button onClick={() => setOpenDialog(false)} variant="outline">Cancel</Button>
                                    <Button
                                        disabled={!file || !jobDescription || loading}
                                        onClick={onAutofill}
                                        className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
                                    >
                                        {loading ? <HiArrowPath className='animate-spin' /> : <div className="flex items-center gap-2"><HiSparkles /> Generate</div>}
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AddResume