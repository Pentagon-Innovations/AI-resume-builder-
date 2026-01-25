import { ResumeInfoContext } from '@/context/ResumeInfoContext'
import { useContext, useEffect } from 'react'

import CVTemplate from './CVTemplate';
import CVTemplate_one from './preview/CVTemplate_one';
import CVTemplate_three from './preview/CVTemplate_three';
import CVTemplate_four from './preview/CVTemplate_four';

function ResumePreview() {

    const {resumeInfo}=useContext(ResumeInfoContext);
    useEffect(() => {
     if (resumeInfo?.templateType === 1) {
        import("./preview/CVTemplate_one.scss");
      } else if (resumeInfo?.templateType === 2) {
        import("./preview/CVTemplate_three.scss");
      } else if (resumeInfo?.templateType === 3) {
        import("./preview/CVTemplate_four.scss");
      }
    }, [resumeInfo?.templateType]); // Runs when templateType changes

  return (
    <div className='h-full'
    style={{
        borderColor:resumeInfo?.themeColor
    }}>
       {resumeInfo && (resumeInfo.templateType == 0 || !resumeInfo.templateType) && <CVTemplate resumeInfo={resumeInfo} /> }
       {resumeInfo && resumeInfo.templateType == 1 && <CVTemplate_one resumeInfo={resumeInfo}></CVTemplate_one>}
       {resumeInfo && resumeInfo.templateType == 2 && <CVTemplate_three resumeInfo={resumeInfo}></CVTemplate_three>}
       {resumeInfo && resumeInfo.templateType == 3 && <CVTemplate_four resumeInfo={resumeInfo}></CVTemplate_four>}
    </div>
  )
}

export default ResumePreview