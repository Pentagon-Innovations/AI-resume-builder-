import { ResumeInfoContext } from '@/context/ResumeInfoContext';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GlobalApi from 'service/GlobalApi';

function DownLoadResumePreview() {
  const { resumeInfo } = useContext(ResumeInfoContext);
  const [pdfUrl, setPdfUrl] = useState('');
  const { resumeId } = useParams()
  // Fetch PDF on component mount
  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const resp = await GlobalApi.GetPdf(resumeId);
        const pdfUrl = URL.createObjectURL(resp.data);
        setPdfUrl(pdfUrl);
      } catch (error) {
        console.error('Error fetching PDF:', error);
      }
    };

    fetchPdf();
  }, []);

  return (
    <div className='shadow-lg h-full p-14 border-t-[20px]' style={{ borderColor: resumeInfo?.themeColor }}>


      {/* PDF Preview */}
      {pdfUrl && (
        <div className="pdf-preview mt-8">
          <iframe
            src={pdfUrl}
            width="100%"
            height="600px"
            style={{ border: 'none' }}
            title="Resume PDF Preview"
          ></iframe>
        </div>
      )}
    </div>
  );
}

export default DownLoadResumePreview;
