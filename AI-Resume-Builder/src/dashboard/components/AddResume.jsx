import { Loader2, PlusSquare } from 'lucide-react'
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
                    title: `Autofilled - ${new Date().toLocaleDateString()}`,
                    resumeId: uuid,
                    userEmail: user?.primaryEmailAddress?.emailAddress,
                    userName: user?.fullName,
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
                <PlusSquare />
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Resume</DialogTitle>
                        <DialogDescription>
                            Choose how you want to create your resume
                        </DialogDescription>
                    </DialogHeader>

                    <div className="w-full mt-4">
                        <div className="flex w-full grid-cols-2 bg-slate-100 p-1 rounded-md">
                            <button
                                className={`flex-1 p-2 text-sm rounded-md transition-all ${activeTab === 'empty' ? 'bg-white shadow' : ''}`}
                                onClick={() => setActiveTab('empty')}
                            >
                                Start from Scratch
                            </button>
                            <button
                                className={`flex-1 p-2 text-sm rounded-md transition-all ${activeTab === 'autofill' ? 'bg-white shadow' : ''}`}
                                onClick={() => setActiveTab('autofill')}
                            >
                                Autofill with AI
                            </button>
                        </div>

                        {/* Empty Resume Tab */}
                        {activeTab === 'empty' && (
                            <div className="mt-4">
                                <p className="mt-2 text-sm text-gray-600">Add a title for your new resume</p>
                                <Input className="my-2"
                                    placeholder="Ex. Full Stack Resume"
                                    onChange={(e) => setResumeTitle(e.target.value)}
                                />
                                <div className='flex justify-end gap-5 mt-4'>
                                    <Button onClick={() => setOpenDialog(false)} variant="ghost">Cancel</Button>
                                    <Button
                                        disabled={!resumeTitle || loading}
                                        onClick={() => onCreate()}>
                                        {loading ? <Loader2 className='animate-spin' /> : 'Create'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Autofill Tab */}
                        {activeTab === 'autofill' && (
                            <div className="space-y-4 mt-4">
                                <div>
                                    <p className="text-sm font-medium mb-1">Upload Current Resume (PDF/DOCX)</p>
                                    <Input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.docx,.txt" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-1">Target Job Description</p>
                                    <Textarea
                                        placeholder="Paste the job description here..."
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        className="h-32"
                                    />
                                </div>
                                <div className='flex justify-end gap-5'>
                                    <Button onClick={() => setOpenDialog(false)} variant="ghost">Cancel</Button>
                                    <Button
                                        disabled={!file || !jobDescription || loading}
                                        onClick={onAutofill}>
                                        {loading ? <Loader2 className='animate-spin' /> : 'Generate & Create'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AddResume