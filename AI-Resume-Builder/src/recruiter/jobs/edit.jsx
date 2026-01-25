import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GlobalApi from 'service/GlobalApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

function EditJob() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        description: ''
    });

    useEffect(() => {
        fetchJobDetails();
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            const resp = await GlobalApi.GetJobById(id);
            const { title, company, location, description } = resp.data;
            setFormData({ title, company, location, description });
        } catch (err) {
            console.error('Failed to fetch job', err);
            if (err.response?.status === 401) navigate('/auth/sign-in');
            else alert('Failed to load job details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await GlobalApi.UpdateJob(id, formData);
            navigate('/recruiter/jobs');
        } catch (err) {
            console.error('Failed to update job', err);
            if (err.response?.status === 401) {
                alert('Session expired. Please login again.');
                navigate('/auth/sign-in');
            } else {
                alert('Failed to update job. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading job details...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-500 hover:text-indigo-600 transition">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
            </button>

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Job Opening</h1>
                <p className="text-gray-600">Update the role details and requirements.</p>
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
                        placeholder="Paste the full job description here."
                        className="h-64"
                        required
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button variant="ghost" onClick={() => navigate('/recruiter/jobs')}>Cancel</Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                        {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default EditJob;
