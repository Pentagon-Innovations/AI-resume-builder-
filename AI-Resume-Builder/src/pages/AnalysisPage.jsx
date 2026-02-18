import React from 'react'
import ResumeMatcher from '@/components/resume-match/ResumeMatcher'

function AnalysisPage() {
    return (
        <div className='py-10'>
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Resume & JD Analysis</h2>
                <p className="text-gray-500 mb-8">Optimize your resume for specific job descriptions using AI.</p>
                <ResumeMatcher />
            </div>
        </div>
    )
}

export default AnalysisPage
