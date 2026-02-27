import { ResumeInfoContext } from '@/context/ResumeInfoContext'
import { useContext, useEffect, useRef } from 'react'

import CVTemplate from './CVTemplate';
import CVTemplate_one from './preview/CVTemplate_one';
import CVTemplate_three from './preview/CVTemplate_three';
import CVTemplate_four from './preview/CVTemplate_four';
import CVTemplate_five from './preview/CVTemplate_five';
import CVTemplate_six from './preview/CVTemplate_six';

function ResumePreview() {

  const { resumeInfo, setIsOverflowing } = useContext(ResumeInfoContext);
  const containerRef = useRef();

  useEffect(() => {
    if (resumeInfo?.templateType === 1) {
      import("./preview/CVTemplate_one.scss");
    } else if (resumeInfo?.templateType === 2) {
      import("./preview/CVTemplate_three.scss");
    } else if (resumeInfo?.templateType === 3) {
      import("./preview/CVTemplate_four.scss");
    } else if (resumeInfo?.templateType === 4) {
      import("./preview/CVTemplate_five.scss");
    } else if (resumeInfo?.templateType === 5) {
      import("./preview/CVTemplate_six.scss");
    }
  }, [resumeInfo?.templateType]); // Runs when templateType changes

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // A4 height is approx 1122px at 96 DPI
        const A4_HEIGHT_PX = 1122;
        if (entry.contentRect.height > A4_HEIGHT_PX) {
          setIsOverflowing(true);
        } else {
          setIsOverflowing(false);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [setIsOverflowing]);

  return (
    <div className='h-full'
      ref={containerRef}
      style={{
        borderColor: resumeInfo?.themeColor
      }}>
      {resumeInfo && (resumeInfo.templateType == 0 || !resumeInfo.templateType) && <CVTemplate resumeInfo={resumeInfo} />}
      {resumeInfo && resumeInfo.templateType == 1 && <CVTemplate_one resumeInfo={resumeInfo}></CVTemplate_one>}
      {resumeInfo && resumeInfo.templateType == 2 && <CVTemplate_three resumeInfo={resumeInfo}></CVTemplate_three>}
      {resumeInfo && resumeInfo.templateType == 3 && <CVTemplate_four resumeInfo={resumeInfo}></CVTemplate_four>}
      {resumeInfo && resumeInfo.templateType == 4 && <CVTemplate_five resumeInfo={resumeInfo}></CVTemplate_five>}
      {resumeInfo && resumeInfo.templateType == 5 && <CVTemplate_six resumeInfo={resumeInfo}></CVTemplate_six>}
    </div>
  )
}

export default ResumePreview