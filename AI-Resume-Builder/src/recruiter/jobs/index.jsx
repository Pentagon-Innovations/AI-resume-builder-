import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GlobalApi from 'service/GlobalApi';
import { Button } from '../../components/ui/button';
import { Plus, Search, MapPin, Building2, ChevronRight, Briefcase } from 'lucide-react';

function RecruiterJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this job opening? All associated candidate data will be lost.')) {
            try {
                await GlobalApi.DeleteJob(id);
                setJobs(jobs.filter(job => job._id !== id));
            } catch (err) {
                console.error('Failed to delete job', err);
                alert('Failed to delete job');
            }
        }
    };

    const handleEdit = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/recruiter/jobs/${id}/edit`);
    };

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const resp = await GlobalApi.GetRecruiterJobs();
                setJobs(resp.data);
            } catch (err) {
                console.error('Failed to fetch jobs', err);
                if (err.response?.status === 401) {
                    navigate('/auth/sign-in');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Job Openings</h1>
                    <p className="text-gray-600">Manage and screen candidates for your active roles.</p>
                </div>
                <Link to="/recruiter/jobs/create">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Post New Job
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading jobs...</div>
                    ) : jobs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No jobs posted yet</h3>
                            <p className="text-gray-500 mb-6">Create your first job opening to start screening resumes.</p>
                            <Link to="/recruiter/jobs/create">
                                <Button variant="outline">Post a Job</Button>
                            </Link>
                        </div>
                    ) : jobs.map((job) => (
                        <Link key={job._id} to={`/recruiter/jobs/${job._id}`} className="block hover:bg-gray-50 transition group">
                            <div className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition">{job.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-4 h-4" />
                                            {job.company}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {job.location || 'Remote'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Active
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">Posted on {new Date(job.createdAt).toLocaleDateString()}</p>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs border-gray-200 hover:border-indigo-600 hover:text-indigo-600"
                                            onClick={(e) => handleEdit(e, job._id)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs border-gray-200 hover:border-red-600 hover:text-red-600"
                                            onClick={(e) => handleDelete(e, job._id)}
                                        >
                                            Delete
                                        </Button>
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default RecruiterJobs;
