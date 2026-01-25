import axios from "axios";

// Centralized sanitization with high redundancy
const rawBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").trim();
const BASE_URL = rawBase.replace(/\/+$/, "");
console.log('%c[GlobalApi] ENV:', 'color: orange', import.meta.env);
console.log('%c[GlobalApi] BASE_URL resolved to:', 'color: cyan; font-weight: bold;', BASE_URL);

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication
const Register = (data) => axiosClient.post('/auth/register', data);
const Login = (data) => axiosClient.post('/auth/login', data);
const ForgotPassword = (email) => axiosClient.post('/auth/forgot-password', { email });
const ResetPassword = (data) => axiosClient.post('/auth/reset-password', data);

const CreateNewResume = (data, isMultipart = false) =>
  axiosClient.post('/resumes', data, {
    headers: {
      'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json',
    },
  });

const GetUserResumes = (userEmail) =>
  axiosClient.get('/resumes?userEmail=' + userEmail);

const UpdateResumeDetail = (id, data, isMultipart = false) =>
  axiosClient.put('/resumes/' + id, data, {
    headers: {
      'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json',
    },
  });

const GetResumeById = (id) =>
  axiosClient.get('/resumes/' + id + "?populate=*");

const DeleteResumeById = (id) =>
  axiosClient.delete('/resumes/' + id);

const AutofillResume = (data) =>
  axiosClient.post('/improve-resume/autofill', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

const FullAutoImprove = (data) =>
  axiosClient.post('/improve-resume/full-auto-improve', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// ATS System
const PostNewJob = (data) => axiosClient.post('/ats/jobs', data);
const GetRecruiterJobs = () => axiosClient.get('/ats/jobs');
const GetJobById = (id) => axiosClient.get('/ats/jobs/' + id);
const UpdateJob = (id, data) => axiosClient.patch('/ats/jobs/' + id, data);
const DeleteJob = (id) => axiosClient.delete('/ats/jobs/' + id);
const ScreenResumes = (jobId, data) =>
  axiosClient.post(`/ats/jobs/${jobId}/screen`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
const GetRankedCandidates = (jobId) => axiosClient.get(`/ats/jobs/${jobId}/candidates`);
const GetAllCandidates = () => axiosClient.get('/ats/candidates');

// Analyze
const AnalyzeResume = (data) => axiosClient.post('/analyze', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
const GenerateJD = (data) => axiosClient.post('/analyze/generate-jd', data);
const ParseResume = (data) => axiosClient.post('/analyze/parse-resume', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Improve Resume
const ImproveSection = (data) => axiosClient.post('/improve-resume/improve-section', data);

// PDF
const GetPdf = (id) => axiosClient.get('/pdf/' + id, { responseType: 'blob' });
const GetProfilePhoto = (id) => axiosClient.get('/resumes/' + id + '/photo', { responseType: 'blob' });

// Billing
const CreateRazorpayOrder = (data) => axiosClient.post('/billing/razorpay/order', data);
const VerifyRazorpayPayment = (data) => axiosClient.post('/billing/razorpay/verify', data);

export default {
  CreateNewResume,
  GetUserResumes,
  UpdateResumeDetail,
  GetResumeById,
  DeleteResumeById,
  AutofillResume,
  FullAutoImprove,
  PostNewJob,
  GetRecruiterJobs,
  GetJobById,
  UpdateJob,
  DeleteJob,
  UpdateCandidate: (id, data) => axiosClient.patch(`/ats/candidates/${id}`, data),
  DeleteCandidate: (id) => axiosClient.delete(`/ats/candidates/${id}`),
  ScreenResumes,
  GetRankedCandidates,
  GetAllCandidates,
  AnalyzeResume,
  GenerateJD,
  ParseResume,
  FullAutoImprove,
  ImproveSection,
  GetPdf,
  GetProfilePhoto,
  CreateRazorpayOrder,
  VerifyRazorpayPayment,
  Register,
  Login,
  ForgotPassword,
  ResetPassword,
  BASE_URL,
};
