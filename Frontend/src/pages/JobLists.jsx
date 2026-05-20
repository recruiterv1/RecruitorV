import React, { useEffect, useState } from 'react'
import { MapPin, IndianRupee, BadgePercent, CalendarDays, Flame, Clock } from 'lucide-react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const JobLists = () => {
  
  const [latest, setLatest] = useState([])
  const [openPOP, setOpenPOP] = useState(false)

  useEffect(() => {
    axios
      .get("/candidate/latest/candi")
      .then((res) => setLatest(res.data))
      .catch((err) => console.log(err))
  }, [])

  const formatDate = (datePosted) => {
    if (!datePosted?._seconds) return ""
    const postDate = new Date(datePosted._seconds * 1000)
    const now = new Date()
    const diffTime = now - postDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return postDate.toLocaleDateString()
  }

  return (
    <div className="bg-white flex justify-center items-start py-16 px-4 sm:px-6">
      <div className="w-full max-w-7xl">

        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-3">
              <Flame size={16} />
              <span>Hot Opportunities</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900">
              Latest Job{" "}
              <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                Openings
              </span>
            </h2>
            <p className="text-gray-600 mt-2">Fresh opportunities updated daily</p>
          </div>
          
          {/* <Link
            to="/all-jobs"
            className="hidden md:inline-flex items-center gap-2 text-blue-600 hover:text-orange-500 font-semibold transition-colors"
          >
            <span>View All</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link> */}
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {latest.map((job, index) => (
            <div 
              key={job.id}
              onClick={() => setOpenPOP(true)} 
              className="group bg-white border-2 border-gray-100 hover:border-blue-300 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 flex flex-col justify-between cursor-pointer relative overflow-hidden"
              style={{
                animation: `fadeInScale 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Hot Badge */}
              {index < 3 && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Flame size={12} />
                  <span>HOT</span>
                </div>
              )}

              {/* Job Title */}
              <h3 className="font-bold mb-3 text-gray-900 text-lg line-clamp-2 pr-12">
                {job.position}
              </h3>

              {/* Client */}
              {job.client && (
                <div className="text-blue-600 text-sm font-semibold mb-3 truncate">
                  {job.client}
                </div>
              )}

              {/* Details */}
              <div className="space-y-2 mb-4">
                {/* Location */}
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin size={16} className="mr-2 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{job.location.join(", ")}</span>
                </div>

                {/* Salary */}
                {job.ctcStart && job.ctcEnd ? (
                  <div className="flex items-center text-gray-600 text-sm">
                    <IndianRupee size={16} className="mr-2 text-green-600 flex-shrink-0" />
                    <span className="truncate">
                      ₹{Number(job.ctcStart).toLocaleString('en-IN')} – ₹{Number(job.ctcEnd).toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-600 text-sm">
                    <IndianRupee size={16} className="mr-2 text-green-600 flex-shrink-0" />
                    <span>{job.ctc}</span>
                  </div>
                )}
              </div>

              {/* Commission Badge */}
              {job.commison && (
                <div className="bg-gradient-to-r from-blue-50 to-orange-50 border-2 border-blue-200 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-center text-blue-700 text-sm font-bold">
                    <BadgePercent size={18} className="mr-2" />
                    {job.ctcStart ? (
                      <span>
                        Commission: ₹{((Number(job.ctcStart) * Number(job.commison)) / 100).toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span>{job.commison}% Commission</span>
                    )}
                  </div>
                </div>
              )}

              {/* Posted Date */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock size={14} />
                  <span>Posted {formatDate(job.datePosted)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Registration Popup */}
      {openPOP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl text-center transform scale-100 animate-popIn">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Are you registered?
            </h2>
            <p className="text-gray-600 mb-6">
              Sign in to apply for this position or register to get started
            </p>

            <div className="flex flex-col gap-3">
              <Link
                to="/log_rec"
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Yes, I'm Registered
              </Link>

              <Link
                to="/reg"
                className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                No, Register Me
              </Link>
            </div>

            <button
              onClick={() => setOpenPOP(false)}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-popIn {
          animation: popIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default JobLists;



