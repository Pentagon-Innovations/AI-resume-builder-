import { Input } from '@/components/ui/input'
import { useContext, useEffect, useState } from 'react'
import { Rating } from '@smastrom/react-rating'

import '@smastrom/react-rating/style.css'
import { Button } from '@/components/ui/button'
import { HiArrowPath, HiTrash } from "react-icons/hi2"
import { ResumeInfoContext } from '@/context/ResumeInfoContext'
import GlobalApi from 'service/GlobalApi'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
function Skills() {

    const [skillsList, setSkillsList] = useState([{
        name: '',
        rating: 0
    }])
    const { resumeId } = useParams();

    const [loading, setLoading] = useState(false);
    const { resumeInfo, setResumeInfo } = useContext(ResumeInfoContext);


    const handleChange = (index, name, value) => {
        const newEntries = skillsList.slice();

        newEntries[index][name] = value;
        setSkillsList(newEntries);
    }

    const AddNewSkills = () => {
        setSkillsList([...skillsList, {
            name: '',
            rating: 0
        }])
    }
    const RemoveSkill = (index) => {
        const newEntries = skillsList.filter((_, i) => i !== index);
        setSkillsList(newEntries);
    }

    const onSave = () => {

        setLoading(true);
        const data = {
            skills: skillsList.map(({ id, ...rest }) => rest)
        }

        GlobalApi.UpdateResumeDetail(resumeId, data)
            .then(resp => {
                console.log(resp);
                setLoading(false);
                toast('Details updated !')
            }, () => {
                setLoading(false);
                toast('Server Error, Try again!')
            })
    }

    useEffect(() => {
        if (resumeInfo?.skills?.length > 0) {
            // Fix: Prevent infinite loop by checking if data actually changed
            if (JSON.stringify(resumeInfo.skills) !== JSON.stringify(skillsList)) {
                setSkillsList(resumeInfo.skills);
            }
        }
    }, [resumeInfo]);

    useEffect(() => {
        setResumeInfo({
            ...resumeInfo,
            skills: skillsList
        })
    }, [skillsList])
    return (
        <div className='p-5 shadow-lg rounded-lg border-t-primary border-t-4 mt-10'>
            <h2 className='font-bold text-lg'>Skills</h2>
            <p>Add Your top professional key skills</p>

            {/* Suggested Skills from JD */}
            {(() => {
                const missingSkills = JSON.parse(localStorage.getItem('missingSkills') || '[]');
                if (missingSkills.length > 0) {
                    return (
                        <div className='my-5 p-4 bg-primary/5 rounded-lg border border-primary/20'>
                            <h3 className='text-sm font-bold text-primary mb-2 flex items-center gap-2'>
                                <span className='animate-pulse'>✨</span> Suggested Skills (Missing from JD)
                            </h3>
                            <div className='flex flex-wrap gap-2'>
                                {missingSkills.map((skill, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] h-7 bg-white hover:bg-primary hover:text-white transition-all"
                                        onClick={() => {
                                            if (!skillsList.find(s => s.name.toLowerCase() === skill.toLowerCase())) {
                                                setSkillsList([...skillsList, { name: skill, rating: 5 }]);
                                            }
                                        }}
                                    >
                                        + {skill}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            <div>
                {skillsList && skillsList.length && skillsList.map((item, index) => (
                    <div className='flex justify-between mb-2 border rounded-lg p-3 '>
                        <div>
                            <label htmlFor={'skillName-' + index} className='text-xs'>Name</label>
                            <Input id={'skillName-' + index} name="skillName" className="w-full"
                                value={item.name || ''}
                                onChange={(e) => handleChange(index, 'name', e.target.value)} />
                        </div>
                        <div className='flex flex-col items-center justify-center gap-2'>
                            <Rating style={{ maxWidth: 120 }} value={item.rating}
                                onChange={(v) => handleChange(index, 'rating', v)} />
                            <HiTrash
                                className='h-5 w-5 text-red-500 cursor-pointer hover:scale-110 transition-all'
                                onClick={() => RemoveSkill(index)}
                            />
                        </div>

                    </div>
                ))}
            </div>
            <div className='flex justify-between'>
                <div className='flex gap-2'>
                    <Button variant="outline" onClick={AddNewSkills} className="text-primary"> + Add More Skill</Button>
                </div>
                <Button disabled={loading} onClick={() => onSave()}>
                    {loading ? <HiArrowPath className='animate-spin' /> : 'Save'}
                </Button>
            </div>
        </div>
    )
}

export default Skills