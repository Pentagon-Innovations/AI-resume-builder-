import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResumeInfoContext } from "@/context/ResumeInfoContext";
import { HiArrowPath } from "react-icons/hi2";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import GlobalApi from 'service/GlobalApi';
import { toast } from "sonner";
import { formatDate, formatDateForInput } from "@/lib/utils";

function Education() {
  const [loading, setLoading] = useState(false);
  const { resumeInfo, setResumeInfo } = useContext(ResumeInfoContext);
  const params = useParams();
  const eduList = resumeInfo && resumeInfo.education && resumeInfo.education.length ? resumeInfo.education : [
    {
      universityName: "",
      degree: "",
      major: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  ];
  const [educationalList, setEducationalList] = useState(eduList);


  const handleChange = (event, index) => {
    const newEntries = educationalList.slice();
    const { name, value } = event.target;
    newEntries[index][name] = value;
    setEducationalList(newEntries);
  };

  const AddNewEducation = () => {
    setEducationalList([
      ...educationalList,
      {
        universityName: "",
        degree: "",
        major: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ]);
  };
  const RemoveEducation = () => {
    setEducationalList((educationalList) => educationalList.slice(0, -1));
  };
  const onSave = () => {
    setLoading(true);
    const data = {
      education: educationalList.map(({ id, ...rest }) => rest),
    };

    GlobalApi.UpdateResumeDetail(params.resumeId, data).then(
      (resp) => {
        console.log(resp);
        setLoading(false);
        toast("Details updated !");
      },
      () => {
        setLoading(false);
        toast("Server Error, Please try again!");
      }
    );
  };

  useEffect(() => {
    if (resumeInfo?.education?.length > 0) {
      setEducationalList(resumeInfo.education);
    }
  }, [resumeInfo]);

  useEffect(() => {
    setResumeInfo({
      ...resumeInfo,
      education: educationalList,
    });
  }, [educationalList]);
  return (
    <div className="p-5 shadow-lg rounded-lg border-t-primary border-t-4 mt-10">
      <h2 className="font-bold text-lg">Education</h2>
      <p>Add Your educational details</p>

      <div>
        {educationalList &&
          educationalList.map((item, index) => (
            <div>
              <div className="grid grid-cols-2 gap-3 border p-3 my-5 rounded-lg">
                <div className="col-span-2">
                  <label htmlFor={'universityName-' + index}>University Name</label>
                  <Input
                    id={'universityName-' + index}
                    name="universityName"
                    onChange={(e) => handleChange(e, index)}
                    value={item?.universityName || ''}
                  />
                </div>
                <div>
                  <label htmlFor={'degree-' + index}>Degree</label>
                  <Input
                    id={'degree-' + index}
                    name="degree"
                    onChange={(e) => handleChange(e, index)}
                    value={item?.degree || ''}
                  />
                </div>
                <div>
                  <label htmlFor={'major-' + index}>Major</label>
                  <Input
                    id={'major-' + index}
                    name="major"
                    onChange={(e) => handleChange(e, index)}
                    value={item?.major || ''}
                  />
                </div>
                <div>
                  <label htmlFor={'startDate-' + index}>Start Date</label>
                  <Input
                    id={'startDate-' + index}
                    type="date"
                    name="startDate"
                    onChange={(e) => handleChange(e, index)}
                    value={formatDateForInput(item?.startDate)}
                  />
                </div>
                <div>
                  <label htmlFor={'endDate-' + index}>End Date</label>
                  <Input
                    id={'endDate-' + index}
                    type="date"
                    name="endDate"
                    disabled={item?.currentlyWorking}
                    onChange={(e) => handleChange(e, index)}
                    value={item?.currentlyWorking ? '' : formatDateForInput(item?.endDate)}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input id={'currentlyStudying-' + index} type="checkbox"
                      name="currentlyWorking"
                      checked={item?.currentlyWorking || false}
                      onChange={(e) => {
                        const newEntries = educationalList.slice();
                        newEntries[index].currentlyWorking = e.target.checked;
                        newEntries[index].endDate = e.target.checked ? 'Present' : '';
                        setEducationalList(newEntries);
                      }}
                    />
                    <label htmlFor={'currentlyStudying-' + index} className="text-xs">Currently Studying</label>
                  </div>
                </div>
                <div className="col-span-2">
                  <label htmlFor={'description-' + index}>Description</label>
                  <Textarea
                    id={'description-' + index}
                    name="description"
                    onChange={(e) => handleChange(e, index)}
                    value={item?.description || ''}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={AddNewEducation}
            className="text-primary"
          >
            {" "}
            + Add More Education
          </Button>
          <Button
            variant="outline"
            onClick={RemoveEducation}
            className="text-primary"
          >
            {" "}
            - Remove
          </Button>
        </div>
        <Button disabled={loading} onClick={() => onSave()}>
          {loading ? <HiArrowPath className="animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default Education;
