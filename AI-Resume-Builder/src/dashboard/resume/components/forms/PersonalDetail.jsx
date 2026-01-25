import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ResumeInfoContext } from '@/context/ResumeInfoContext'
import { LoaderCircle } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import GlobalApi from 'service/GlobalApi';
import { toast } from 'sonner';

function PersonalDetail({ enabledNext }) {

    const params = useParams();
    const { resumeInfo, setResumeInfo } = useContext(ResumeInfoContext);

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);

    useEffect(() => {
        if (resumeInfo) {
            setFormData(resumeInfo);
        }
    }, [resumeInfo]);

    const handleInputChange = (e) => {
        enabledNext(false);
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });
        setResumeInfo({
            ...resumeInfo,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePhoto(file);
            // Optionally, you can also update the resumeInfo context with the file
            setResumeInfo({
                ...resumeInfo,
                profilePhoto: URL.createObjectURL(file) // Create a URL for the file
            });
        }
    };

    const onSave = (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();

        // Only append standard personal fields to avoid corrupting data with nested objects
        const fields = ['firstName', 'lastName', 'jobTitle', 'address', 'phone', 'email'];
        fields.forEach(field => {
            if (formData[field]) {
                data.append(field, formData[field]);
            }
        });

        // Append the file
        if (profilePhoto) {
            data.append('profilePhoto', profilePhoto);
        }

        console.log("FormData sent:", data); // Debugging
        const isMultipart = true;
        GlobalApi.UpdateResumeDetail(params?.resumeId, data, isMultipart)
            .then(resp => {
                console.log(resp);
                enabledNext(true);
                setLoading(false);
                toast("Details updated");
            })
            .catch(error => {
                setLoading(false);
                console.error("Upload Error:", error);
            });
    };

    return (
        <div className='p-5 shadow-lg rounded-lg border-t-primary border-t-4 mt-10'>
            <h2 className='font-bold text-lg'>Personal Detail</h2>
            <p>Get Started with the basic information</p>

            <form onSubmit={onSave}>
                <div className='grid grid-cols-2 mt-5 gap-3'>
                    <div>
                        <label className='text-sm'>First Name</label>
                        <Input name="firstName" value={resumeInfo?.firstName || ''} required onChange={handleInputChange} />
                    </div>
                    <div>
                        <label className='text-sm'>Last Name</label>
                        <Input name="lastName" required onChange={handleInputChange}
                            value={resumeInfo?.lastName || ''} />
                    </div>
                    <div className='col-span-2'>
                        <label className='text-sm'>Job Title</label>
                        <Input name="jobTitle" required
                            value={resumeInfo?.jobTitle || ''}
                            onChange={handleInputChange} />
                    </div>
                    <div className='col-span-2'>
                        <label className='text-sm'>Address</label>
                        <Input name="address" required
                            value={resumeInfo?.address || ''}
                            onChange={handleInputChange} />
                    </div>
                    <div>
                        <label className='text-sm'>Phone</label>
                        <Input name="phone" required
                            value={resumeInfo?.phone || ''}
                            onChange={handleInputChange} />
                    </div>
                    <div>
                        <label className='text-sm'>Email</label>
                        <Input name="email" required
                            value={resumeInfo?.email || ''}
                            onChange={handleInputChange} />
                    </div>
                    <div className='col-span-2'>
                        <label className='text-sm'>Profile Photo</label>
                        <Input type="file" name="profilePhoto" onChange={handleFileChange} accept="image/*" />
                    </div>
                </div>
                <div className='mt-3 flex justify-end'>
                    <Button type="submit"
                        disabled={loading}>
                        {loading ? <LoaderCircle className='animate-spin' /> : 'Save'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default PersonalDetail;