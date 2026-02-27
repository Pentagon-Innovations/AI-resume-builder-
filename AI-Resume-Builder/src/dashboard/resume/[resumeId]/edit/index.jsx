import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import FormSection from '../../components/FormSection';
import ResumePreview from '../../components/ResumePreview';
import { ResumeInfoContext } from '@/context/ResumeInfoContext';
import GlobalApi from 'service/GlobalApi';

function EditResume() {
  const { resumeId } = useParams();
  const [resumeInfo, setResumeInfo] = useState();
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isCompacting, setIsCompacting] = useState(false);

  useEffect(() => {
    GetResumeInfo();
  }, [])


  const GetResumeInfo = () => {
    GlobalApi.GetResumeById(resumeId).then(resp => {
      console.log(resp.data);
      setResumeInfo(resp.data);
    })
  }

  const handleSmartCompact = async () => {
    if (!resumeInfo || isCompacting) return;

    setIsCompacting(true);
    try {
      // Prompt logic: focus on Professional Summary and Experiences as they are usually the bulkiest
      const prompt = `Condense the following resume content to fit on a single page while maintaining professional impact and keywords. 
      Summary: ${resumeInfo.summery}
      Experiences: ${JSON.stringify(resumeInfo.experience.map(exp => exp.description))}
      
      Return a JSON object with "summery" and "experiences" (array of condensed descriptions).`;

      const resp = await GlobalApi.GenerateAIContent(prompt);
      // Assuming GenerateAIContent returns the condensed text, we might need to parse it if it's JSON
      let data = resp.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data.replace(/```json|```/g, '').trim());
        } catch (e) {
          console.error("Failed to parse AI response:", e);
        }
      }

      if (data.summery || data.experiences) {
        const updatedResume = { ...resumeInfo };
        if (data.summery) updatedResume.summery = data.summery;
        if (data.experiences && Array.isArray(data.experiences)) {
          updatedResume.experience = updatedResume.experience.map((exp, idx) => ({
            ...exp,
            description: data.experiences[idx] || exp.description
          }));
        }
        setResumeInfo(updatedResume);
        GlobalApi.UpdateResumeDetail(resumeId, {
          summery: updatedResume.summery,
          experience: updatedResume.experience
        });
      }
    } catch (error) {
      console.error("Smart Compact failed:", error);
    } finally {
      setIsCompacting(false);
    }
  };

  return (
    <ResumeInfoContext.Provider value={{ resumeInfo, setResumeInfo, isOverflowing, setIsOverflowing }}>
      {isOverflowing && (
        <div className='fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce'>
          <div className='bg-orange-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 border-2 border-white'>
            <span className='font-bold flex items-center gap-2'>
              ⚠️ Resume exceeds 1 page
            </span>
            <button
              onClick={handleSmartCompact}
              disabled={isCompacting}
              className='bg-white text-orange-600 px-4 py-1 rounded-full text-xs font-black uppercase hover:bg-orange-50 transition-colors flex items-center gap-2'
            >
              {isCompacting ? (
                <div className='w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin' />
              ) : '✨ Smart Compact (AI)'}
            </button>
          </div>
        </div>
      )}
      <div className='grid grid-cols-1 md:grid-cols-2 p-10 gap-10'>
        {/* Form Section  */}
        <FormSection />
        {/* Preview Section  */}
        <ResumePreview />
      </div>
    </ResumeInfoContext.Provider>
  )
}

export default EditResume