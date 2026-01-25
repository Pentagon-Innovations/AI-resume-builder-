import React, { useContext, useState } from 'react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { LayoutGrid } from 'lucide-react'
import { ResumeInfoContext } from '@/context/ResumeInfoContext'
import GlobalApi from 'service/GlobalApi'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

function Template() {

    const templates = [
        {
            id: 0,
            name: 'Modern',
            color: '#8e44ad',
            isPremium: false
        },
        {
            id: 1,
            name: 'Professional',
            color: '#2980b9',
            isPremium: true
        },
        {
            id: 2,
            name: 'Bold',
            color: '#27ae60',
            isPremium: true
        },
        {
            id: 3,
            name: 'Minimal',
            color: '#c0392b',
            isPremium: false
        }
    ]

    const { user } = useAuth();

    const { resumeInfo, setResumeInfo } = useContext(ResumeInfoContext);
    const { resumeId } = useParams();

    const onTemplateSelect = (item) => {
        if (item.isPremium && user?.plan !== 'pro') {
            toast('This is a Premium template. Please upgrade to Pro!');
            return;
        }
        setResumeInfo({
            ...resumeInfo,
            templateType: item.id
        });
        const data = {
            templateType: item.id
        }

        GlobalApi.UpdateResumeDetail(resumeId, data).then(resp => {
            console.log(resp);
            toast('Template Updated')
        })
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm"
                    className="flex gap-2" > <LayoutGrid /> Template</Button>
            </PopoverTrigger>
            <PopoverContent>
                <h2 className='mb-2 text-sm font-bold'>Select Template</h2>
                <div className='grid grid-cols-2 gap-3'>
                    {templates.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => onTemplateSelect(item)}
                            className={`
                            p-2 rounded-lg border cursor-pointer hover:border-primary hover:bg-slate-50 relative
                            ${resumeInfo?.templateType === item.id ? 'border-primary bg-slate-100' : 'border-gray-200'}
                            `}
                        >
                            {item.isPremium && user?.plan !== 'pro' && (
                                <div className='absolute top-2 right-2'>
                                    <Lock className='w-4 h-4 text-gray-400' />
                                </div>
                            )}
                            <div className='h-20 w-full rounded-md mb-2'
                                style={{ background: item.color, opacity: 0.2 }}></div>
                            <h2 className='text-center text-sm font-medium'>{item.name}</h2>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default Template