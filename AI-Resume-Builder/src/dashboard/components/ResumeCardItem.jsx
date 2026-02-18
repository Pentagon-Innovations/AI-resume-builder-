import { HiEllipsisVertical, HiArrowPath, HiPencilSquare, HiEye, HiArrowDownTray, HiTrash } from "react-icons/hi2"
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import GlobalApi from 'service/GlobalApi'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"

function ResumeCardItem({ resume, refreshData }) {

  const navigation = useNavigate();
  const [openAlert, setOpenAlert] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDelete = () => {
    if (!resume._id) {
      toast.error('Invalid resume ID');
      setOpenAlert(false);
      return;
    }
    setLoading(true);
    GlobalApi.DeleteResumeById(resume._id).then(resp => {
      console.log(resp);
      toast.success('Resume Deleted Successfully!');
      refreshData()
      setLoading(false);
      setOpenAlert(false);
    }, (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete resume');
      setLoading(false);
    })
  }

  // Generate a consistent gradient based on resume ID or index if available
  // Or just use the themeColor if it exists, otherwise a default gradient
  const cardBackground = resume?.themeColor || 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)';
  const isColor = resume?.themeColor && !resume.themeColor.includes('gradient');

  return (
    <div className='group relative transition-all hover:scale-105 duration-300'>
      <Link to={'/dashboard/resume/' + resume._id + "/edit"}>
        <div
          className={cn(
            "p-14 h-[280px] rounded-t-xl border-t-4 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden relative shadow-sm transition-all group-hover:shadow-md",
            !resume?.themeColor && "bg-secondary"
          )}
          style={{
            borderColor: resume?.themeColor || '#7c3aed',
            background: isColor ? `${resume.themeColor}15` : undefined // Light opacity background if solid color
          }}
        >
          {/* Design accents */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"
            style={{ backgroundColor: resume?.themeColor ? `${resume.themeColor}10` : undefined }}></div>

          <div className="flex flex-col items-center justify-center gap-4 transition-transform group-hover:-translate-y-2 duration-300">
            <img src="/cv.png" width={80} height={80} alt="Resume Icon" className="drop-shadow-sm opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Hover overlay hint */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white/90 text-xs font-medium px-3 py-1 rounded-full shadow-sm text-primary">Open Editor</span>
          </div>
        </div>
      </Link>

      <div
        className='border border-t-0 p-3 flex justify-between items-center rounded-b-xl shadow-sm bg-white'
      >
        <div className="flex flex-col">
          <h2 className='text-sm font-semibold truncate max-w-[160px] text-slate-800'>{resume.title}</h2>
          <p className="text-[10px] text-slate-400">Created: {new Date(resume.createdAt).toLocaleDateString()}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <HiEllipsisVertical className='h-5 w-5 text-slate-500 cursor-pointer' />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigation('/dashboard/resume/' + resume._id + "/edit")} className="cursor-pointer gap-2">
              <HiPencilSquare className="w-4 h-4 text-slate-500" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigation('/my-resume/' + resume._id + "/view")} className="cursor-pointer gap-2">
              <HiEye className="w-4 h-4 text-slate-500" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigation('/my-resume/' + resume._id + "/view")} className="cursor-pointer gap-2">
              <HiArrowDownTray className="w-4 h-4 text-slate-500" /> Download PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setOpenAlert(true)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
              <HiTrash className="w-4 h-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete <strong>{resume.title}</strong> and remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOpenAlert(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                {loading ? <HiArrowPath className='animate-spin' /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  )
}

export default ResumeCardItem