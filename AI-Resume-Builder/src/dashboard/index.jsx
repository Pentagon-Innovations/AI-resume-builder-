import { useEffect, useState } from 'react'
import AddResume from './components/AddResume'
import Header from '@/components/custom/Header'
import GlobalApi from 'service/GlobalApi'
import { useAuth } from './../context/AuthContext'
import { LoaderCircle } from 'lucide-react';
import ResumeCardItem from './components/ResumeCardItem';

function Dashboard() {

  const { user } = useAuth();
  const [resumeList, setResumeList] = useState([]);
  const [isAutoCreating, setIsAutoCreating] = useState(false);

  /**
   * Used to Get Users Resume List
   */
  const GetResumesList = () => {
    GlobalApi.GetUserResumes(user?.email)
      .then(resp => {
        console.log(resp.data)
        setResumeList(resp.data);
      })
  }
  useEffect(() => {
    user && GetResumesList()
  }, [user])

  // New: Check for AI-improved resume in localStorage
  useEffect(() => {
    const checkForAIParsedResume = async () => {
      try {
        const parsedResume = localStorage.getItem('parsedResume');
        if (parsedResume && user && !isAutoCreating) {
          const data = JSON.parse(parsedResume);

          if (!data || Object.keys(data).length === 0) {
            console.error("Parsed resume data is empty or invalid.");
            localStorage.removeItem('parsedResume');
            return;
          }

          console.log('Detected AI-improved resume, auto-creating...');
          setIsAutoCreating(true);
          await handleAutoCreate(data);
        }
      } catch (err) {
        console.error("Error reading parsed resume from storage:", err);
        localStorage.removeItem('parsedResume'); // Clear bad data
        setIsAutoCreating(false);
      }
    };
    checkForAIParsedResume();
  }, [user]);

  const handleAutoCreate = async (parsedData) => {
    try {
      const { v4: uuidv4 } = await import('uuid');
      const uuid = uuidv4();
      const payload = {
        title: `AI Improved - ${new Date().toLocaleDateString()} `,
        resumeId: uuid,
        userEmail: user?.email,
        userName: user?.firstName + ' ' + (user?.lastName || ''),
        ...parsedData // Inject the parsed data (experience, skills, etc.)
      };

      GlobalApi.CreateNewResume(payload).then(resp => {
        if (resp) {
          localStorage.removeItem('parsedResume');
          window.location.href = '/dashboard/resume/' + resp.data._id + '/edit';
        }
      }).catch(err => {
        console.error("Failed to create resume:", err);
        alert("Failed to create improved resume. Please try again.");
        setIsAutoCreating(false);
      });
    } catch (error) {
      console.error("Auto-create process failed:", error);
      setIsAutoCreating(false);
    }
  };

  return (
    <div className='p-10 md:px-20 lg:px-32'>
      {isAutoCreating && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <LoaderCircle className="h-12 w-12 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Finalizing your AI-improved resume...</h2>
          <p className="text-gray-600">You'll be in the editor in a moment.</p>
        </div>
      )}
      <h2 className='font-bold text-3xl'>My Resume</h2>
      <p>Start Creating AI resume to your next Job role</p>
      <div className='grid grid-cols-2 
      md:grid-cols-3 lg:grid-cols-5 gap-5
      mt-10
      '>
        <AddResume />
        {resumeList && resumeList.length > 0 ? resumeList.map((resume, index) => (
          <ResumeCardItem resume={resume} key={index} refreshData={GetResumesList} />
        )) :
          [1, 2, 3, 4].map((item) => (
            // eslint-disable-next-line react/jsx-key
            <div className='h-[280px] rounded-lg bg-slate-200 animate-pulse' key={item}>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default Dashboard