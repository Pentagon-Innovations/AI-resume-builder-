import Header from '@/components/custom/Header'
import { Button } from '@/components/ui/button'
import { ResumeInfoContext } from '@/context/ResumeInfoContext'
import DownLoadResumePreview from '@/dashboard/resume/components/DownLoadResumePreview'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import GlobalApi from 'service/GlobalApi'
import { RWebShare } from 'react-web-share'
import { HiArrowDownTray, HiShare, HiCheckCircle } from 'react-icons/hi2'
import { toast } from 'sonner'

function ViewResume() {

    const [resumeInfo, setResumeInfo] = useState();
    const { resumeId } = useParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        GetResumeInfo();
    }, [])

    const GetResumeInfo = () => {
        GlobalApi.GetResumeById(resumeId).then(resp => {
            console.log(resp.data.data);
            setResumeInfo(resp.data.data);
        })
    }

    const HandleDownload = async () => {
        setLoading(true);
        try {
            const resp = await GlobalApi.GetPdf(resumeId);
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${resumeInfo?.firstName}_${resumeInfo?.lastName}_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Resume downloaded successfully!");
        } catch (error) {
            console.error("Error downloading PDF:", error);
            toast.error("Failed to download resume. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <ResumeInfoContext.Provider value={{ resumeInfo, setResumeInfo }} >
            <div id="no-print" className="bg-gray-50 min-h-screen pb-20">
                <Header />

                <div className='my-10 mx-auto max-w-4xl px-4 md:px-10'>
                    {/* Success Message Section */}
                    <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex justify-center mb-6">
                            <div className="bg-green-100 p-4 rounded-full shadow-sm">
                                <HiCheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                        </div>
                        <h1 className='text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight'>
                            Your Resume is Ready!
                        </h1>
                        <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
                            Congratulations! Your AI-generated resume is polished and ready to help you land your dream job. Download it now or share it directly.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex flex-col sm:flex-row justify-center gap-4 mb-16 px-4'>
                        <Button
                            onClick={HandleDownload}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <HiArrowDownTray className="w-6 h-6" />
                                    Download Resume
                                </>
                            )}
                        </Button>

                        <div className="w-full sm:w-auto">
                            <RWebShare
                                data={{
                                    text: `Check out my resume created with AI Resume Builder!`,
                                    url: import.meta.env.VITE_BASE_URL + "/my-resume/" + resumeId + "/view",
                                    title: `${resumeInfo?.firstName} ${resumeInfo?.lastName}'s Resume`,
                                }}
                                onClick={() => toast.success("Shared successfully!")}
                            >
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 px-8 py-6 text-lg rounded-xl flex items-center gap-2 justify-center transition-all bg-white"
                                >
                                    <HiShare className="w-6 h-6" />
                                    Share Resume
                                </Button>
                            </RWebShare>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className='my-10 mx-auto max-w-5xl px-4 md:px-10'>
                    <div id="print-area" className="bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-gray-900/5 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] transition-all duration-300">
                        <DownLoadResumePreview />
                    </div>
                </div>
            </div>
        </ResumeInfoContext.Provider>
    )
}

export default ViewResume