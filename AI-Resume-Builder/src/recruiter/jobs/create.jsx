import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalApi from 'service/GlobalApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';

function CreateJob() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        description: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await GlobalApi.PostNewJob(formData);
            navigate('/recruiter/jobs');
        } catch (err) {
            console.error('Failed to create job', err);
            if (err.response?.status === 401) {
                alert('Session expired. Please login again.');
                navigate('/auth/sign-in');
            } else {
                alert('Failed to create job. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-500 hover:text-indigo-600">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Jobs
            </button>

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
                <p className="text-gray-600">Define the role and requirements to start AI screening.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Job Title</label>
                        <Input
                            placeholder="e.g. Senior Full Stack Engineer"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Company Name</label>
                        <Input
                            placeholder="e.g. Acme Inc"
                            required
                            value={formData.company}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input
                        placeholder="e.g. Remote / New York, NY"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Job Description (JD)</label>
                    <Textarea
                        placeholder="Paste the full job description here. The AI will use this to rank candidates."
                        className="h-64"
                        required
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="ghost" onClick={() => navigate('/recruiter/jobs')}>Cancel</Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                        Create Job Opening
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default CreateJob;
