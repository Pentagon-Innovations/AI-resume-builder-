import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ResumeInfoContext } from '@/context/ResumeInfoContext'
import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import GlobalApi from 'service/GlobalApi';
import { Brain, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AIChatSession } from 'service/AIModal';

const prompt = "Job Title: {jobTitle} , Depends on job title give me list of  summery for 3 experience level, Mid Level and Freasher level in 3 -4 lines in array format, With summery and experience_level Field in JSON Format"
function Summery({ enabledNext }) {
  const { resumeInfo, setResumeInfo } = useContext(ResumeInfoContext);
  const [summery, setSummery] = useState();
  const [loading, setLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const params = useParams();
  const [aiGeneratedSummeryList, setAiGenerateSummeryList] = useState();

  useEffect(() => {
    if (resumeInfo?.summery) {
      setSummery(resumeInfo.summery);
    }
  }, [resumeInfo]);

  useEffect(() => {
    summery && setResumeInfo({
      ...resumeInfo,
      summery: summery
    })
  }, [summery])

  const generateSummaryFromAI = async () => {
    setLoading(true); // Start loading

    try {
      // Replace placeholders in the prompt with actual data
      const formattedPrompt = prompt.replace('{jobTitle}', resumeInfo?.jobTitle || '');
      console.log('Formatted Prompt:', formattedPrompt);

      // Send the prompt to the AI and get the response
      const result = await AIChatSession.sendMessage(formattedPrompt);
      console.log('AI Response:', result.response.text());

      // Parse the AI response
      let responseData;
      try {
        responseData = JSON.parse(result.response.text());
      } catch (error) {
        console.error('Failed to parse AI response:', error);
        throw new Error('Invalid AI response format');
      }

      // Extract the relevant data from the response
      let summaryList;
      if (Array.isArray(responseData)) {
        summaryList = responseData; // Use the array directly
      } else if (responseData && typeof responseData === 'object') {
        // Get the first key in the object
        const objectKey = Object.keys(responseData)[0];
        if (objectKey && Array.isArray(responseData[objectKey])) {
          summaryList = responseData[objectKey]; // Use the array associated with the first key
        } else {
          throw new Error('No valid summary data found in AI response');
        }
      } else {
        throw new Error('Unexpected AI response format');
      }

      // Update state with the generated summary list
      setAiGenerateSummeryList(summaryList);
    } catch (error) {
      console.error('Error generating summary:', error);
      // Handle errors (e.g., show a user-friendly message)
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const improveSummaryWithAI = async () => {
    setIsImproving(true);
    try {
      const resp = await GlobalApi.ImproveSection({
        sectionName: "Summary",
        sectionContent: summery || resumeInfo?.summery
      });
      setSummery(resp.data);
      toast("Summary improved with AI!");
    } catch (error) {
      toast("Failed to improve summary");
    } finally {
      setIsImproving(false);
    }
  };

  const onSave = (e) => {
    e.preventDefault();

    setLoading(true)
    const data = {
      summery: summery
    }
    GlobalApi.UpdateResumeDetail(params?.resumeId, data).then(resp => {
      console.log(resp);
      enabledNext(true);
      setLoading(false);
      toast("Details updated")
    }, (error) => {
      setLoading(false);
    })
  }
  return (
    <div>
      <div className='p-5 shadow-lg rounded-lg border-t-primary border-t-4 mt-10'>
        <h2 className='font-bold text-lg'>Summery</h2>
        <p>Add Summery for your job title</p>

        <form className='mt-7' onSubmit={onSave}>
          <div className='flex justify-between items-end'>
            <label>Add Summery</label>
            <div className='flex gap-2'>
              <Button variant="outline" onClick={() => improveSummaryWithAI()}
                disabled={isImproving}
                type="button" size="sm" className="border-green-600 text-green-600 flex gap-2">
                {isImproving ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <Brain className='h-4 w-4' />}
                Improve with AI
              </Button>
              <Button variant="outline" onClick={() => generateSummaryFromAI()}
                type="button" size="sm" className="border-primary text-primary flex gap-2">
                <Brain className='h-4 w-4' />  Generate from AI
              </Button>
            </div>
          </div>
          <Textarea className="mt-5" required
            value={summery || ''}
            onChange={(e) => setSummery(e.target.value)}
          />
          <div className='mt-2 flex justify-end'>
            <Button type="submit"
              disabled={loading}>
              {loading ? <LoaderCircle className='animate-spin' /> : 'Save'}
            </Button>
          </div>
        </form>
      </div>


      {aiGeneratedSummeryList && <div className='my-5'>
        <h2 className='font-bold text-lg'>Suggestions</h2>
        {aiGeneratedSummeryList?.map((item, index) => (
          <div key={index}
            onClick={() => setSummery(item?.summary)}
            className='p-5 shadow-lg my-4 rounded-lg cursor-pointer'>
            <h2 className='font-bold my-1 text-primary'>Level: {item?.experience_level}</h2>
            <p>{item?.summary}</p>
          </div>
        ))}
      </div>}

    </div>
  )
}

export default Summery