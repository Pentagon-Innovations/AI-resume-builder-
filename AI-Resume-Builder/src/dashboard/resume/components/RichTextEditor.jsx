import { Button } from '@/components/ui/button';
import { ResumeInfoContext } from '@/context/ResumeInfoContext';
import { Brain, Loader2 } from 'lucide-react';
import { useContext, useState, useEffect } from 'react';
import {
  BtnBold,
  BtnBulletList,
  BtnClearFormatting,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnStrikeThrough,
  BtnStyles,
  BtnUnderline,
  Editor,
  EditorProvider,
  HtmlButton,
  Separator,
  Toolbar,
} from 'react-simple-wysiwyg';
import { AIChatSession } from 'service/AIModal';
import { toast } from 'sonner';




function RichTextEditor({ onRichTextEditorChange, index, defaultValue }) {

  const [value, setValue] = useState(defaultValue);
  const { resumeInfo, setResumeInfo } = useContext(ResumeInfoContext);
  const [loading, setLoading] = useState(false);

  let PROMPT =
    `Generate 5-7 concise and impactful bullet points describing my experience as a {positionTitle} at ${resumeInfo?.experience[index]?.companyName} in ${resumeInfo.experience[index]?.city} ${resumeInfo.experience[index]?.state}  from  ${resumeInfo.experience[index]?.startDate}  to ${resumeInfo.experience[index]?.endDate}. Focus on technical skills, key contributions, and accomplishments relevant to the role. Avoid mentioning experience level.`;

  PROMPT += 'Format the response in valid **HTML** bullet points (`<ul><li>` format).';

  const GenerateSummaryFromAI = async () => {
    if (!resumeInfo?.experience[index]?.title) {
      toast('Please Add Position Title');
      return;
    }
    setLoading(true);
    const prompt = PROMPT.replace('{positionTitle}', resumeInfo.experience[index].title);

    try {
      const result = await AIChatSession.sendMessage(prompt);
      const outputText = result.response.text();

      let bulletHtml;

      // If the response is already HTML (starts with <ul>), use it directly
      if (outputText.trim().startsWith('<ul') || outputText.trim().startsWith('<ul>')) {
        bulletHtml = outputText;
      } else {
        // Try to parse as JSON in case AI returned an object
        try {
          const parsedResponse = JSON.parse(outputText);
          if (parsedResponse.bulletPoints && parsedResponse.bulletPoints.length) {
            const bulletPoints = parsedResponse.bulletPoints
              .map((point) => `<li>${point}</li>`)
              .join('');
            bulletHtml = `<ul>${bulletPoints}</ul>`;
          } else if (parsedResponse.bullet_points) {
            bulletHtml = parsedResponse.bullet_points;
          }
        } catch (parseError) {
          // Fallback: wrap it in <ul>
          bulletHtml = outputText.includes('<li>') ? outputText : `<ul>${outputText}</ul>`;
        }
      }

      setValue(bulletHtml);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger logic whenever `value` changes
  useEffect(() => {
    if (value !== defaultValue) {
      onRichTextEditorChange({ target: { value } });
    }
  }, [value]);

  // Sync value when defaultValue changes (e.g. data loaded from backend)
  useEffect(() => {
    if (defaultValue !== value) {
      setValue(defaultValue || '');
    }
  }, [defaultValue]);
  return (
    <div>
      <div className="flex justify-between my-2">
        <label className="text-xs">Summary</label>
        <Button
          variant="outline"
          size="sm"
          onClick={GenerateSummaryFromAI}
          disabled={loading}
          className="flex gap-2 border-primary text-primary"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Brain className="h-4 w-4" /> Generate from AI
            </>
          )}
        </Button>
      </div>
      <EditorProvider>
        <Editor
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        >
          <Toolbar>
            <BtnBold />
            <BtnItalic />
            <BtnUnderline />
            <BtnStrikeThrough />
            <Separator />
            <BtnNumberedList />
            <BtnBulletList />
            <Separator />
            <BtnLink />
          </Toolbar>
        </Editor>
      </EditorProvider>
    </div>
  );
}

export default RichTextEditor;
