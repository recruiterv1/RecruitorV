import React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Users, TrendingUp, Clock, DollarSign } from 'lucide-react'

const featuredJobs = [
  { title: 'Senior Java Developer', location: 'Bangalore', ctc: '₹18 LPA' },
  { title: 'Frontend Engineer', location: 'Pune', ctc: '₹12 LPA' },
  { title: 'Product Manager', location: 'Remote', ctc: '₹25 LPA' },
]

const clients = [
  '/client1.png',
  '/client2.png',
  '/client3.png',
  '/client4.png',
  '/client5.png',
]

const topRecruiters = [
  { name: 'Amit Sharma', placements: 45, response: '2.5 hrs', img: '/recruiter1.jpg' },
  { name: 'Neha Patel', placements: 38, response: '3.1 hrs', img: '/recruiter2.jpg' },
  { name: 'Ravi Kumar', placements: 30, response: '4.2 hrs', img: '/recruiter3.jpg' },
]

const opportunities = [
  { icon: Clock, title: 'Immediate Resume Requests', desc: 'Urgent client needs, faster placement chances.' },
  { icon: TrendingUp, title: 'Upcoming Interview Drives', desc: 'Interviews scheduled within 3 days.' },
  { icon: Briefcase, title: 'Fast-Response Positions', desc: '<24 hour client response.' },
  { icon: DollarSign, title: 'High Commission Roles', desc: 'Earn ₹1 Lakh+ commissions.' },
]

const Home = () => {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Recruiter Adda</h1>
        <p className="text-lg max-w-2xl mx-auto mb-6">
          Transforming India's recruitment landscape with AI-driven hiring, transparent dashboards, and recruiter-first opportunities.
        </p>
        <div className="space-x-4">
          <Link to="/reg" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-100">
            Register Now
          </Link>
          <Link to="/log_rec" className="border border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600">
            Login
          </Link>
        </div>
      </section>

      {/* Featured Jobs Carousel */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-blue-800 mb-6">Featured Job Openings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredJobs.map((job, idx) => (
            <div key={idx} className="bg-white p-5 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-blue-700">{job.title}</h3>
              <p className="text-gray-600">{job.location}</p>
              <p className="text-blue-600 font-bold">{job.ctc}</p>
              <Link to="/reg" className="mt-4 inline-block text-sm text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
                Submit Resume
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Client Showcase */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-blue-800 mb-6">Our Hiring Partners</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 items-center">
            {clients.map((logo, idx) => (
              <img key={idx} src={logo} alt="Client logo" className="h-16 mx-auto grayscale hover:grayscale-0 transition" />
            ))}
          </div>
        </div>
      </section>

      {/* Top Recruiters */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Top Recruiters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topRecruiters.map((rec, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
              <img src={rec.img} alt={rec.name} className="h-20 w-20 rounded-full mx-auto mb-4 object-cover" />
              <h3 className="font-semibold text-blue-700">{rec.name}</h3>
              <p className="text-sm text-gray-600">Placements: {rec.placements}</p>
              <p className="text-sm text-gray-600">Avg Response: {rec.response}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Curated Opportunities */}
      <section className="bg-blue-600 py-12 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-8">Curated Opportunities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {opportunities.map((item, idx) => (
              <div key={idx} className="bg-blue-700 rounded-lg p-6 flex flex-col items-center hover:bg-blue-800 transition">
                <item.icon size={36} className="mb-4" />
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm opacity-90">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16">
        <h2 className="text-3xl font-bold text-blue-800 mb-4">Join India's Fastest Growing Recruiter Network</h2>
        <p className="max-w-xl mx-auto text-gray-600 mb-6">
          Whether you're an independent recruiter or a boutique firm, Recruiter Adda gives you access to top mandates and transparent earnings.
        </p>
        <Link to="/reg" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
          Get Started
        </Link>
      </section>
    </div>
  )
}

export default Home
