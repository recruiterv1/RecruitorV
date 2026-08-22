import React from 'react'
import { Link } from 'react-router-dom'
import { Linkedin, Twitter, Facebook, Mail, Phone, MapPin, ArrowRight, Smartphone } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-orange-600/10 pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <img
                src="/recuiterv-logo.png"
                alt="RecruiterV Logo"
                className="h-16 w-56 object-contain bg-white rounded-lg px-2 py-1 hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Recruiterv is India's fastest-growing recruiter community, built to help hiring teams close roles smarter and faster.  
            </p>
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full"></div>
                <span className="text-xs text-gray-400 font-semibold">Trusted by 1000+ Recruiters</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white flex items-center gap-2">
              <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-orange-500 rounded-full"></div>
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/" 
                  className="group flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-all duration-300"
                >
                  <ArrowRight size={16} className="opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-orange-400" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Home</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/reg" 
                  className="group flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-all duration-300"
                >
                  <ArrowRight size={16} className="opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-orange-400" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Register as Recruiter</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/log_rec" 
                  className="group flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-all duration-300"
                >
                  <ArrowRight size={16} className="opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-orange-400" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Login as Recruiter</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white flex items-center gap-2">
              <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-orange-500 rounded-full"></div>
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 group">
                <div className="bg-blue-600/20 p-2 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                  <Mail size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Email</p>
                  <a 
                    href="mailto:support@recruiterv.in " 
                    className="text-gray-200 hover:text-orange-400 transition-colors"
                  >
                    support@recruiterv.in 
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="bg-orange-600/20 p-2 rounded-lg group-hover:bg-orange-600/30 transition-colors">
                  <Phone size={18} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Phone</p>
                  <a 
                    href="tel:+919315553229" 
                    className="text-gray-200 hover:text-orange-400 transition-colors"
                  >
                    +91-931-555-3229
                  </a>
                  <p className="text-gray-400 text-xs mb-1">09:00 AM - 06:00 PM</p>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="bg-blue-600/20 p-2 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                  <MapPin size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Address</p>
                  <p className="text-gray-200 leading-relaxed">
                    First Floor, Plot No. B 15, Near Medanta Hospital, Sector 32, Gurugram, Haryana 122001
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white flex items-center gap-2">
              <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-orange-500 rounded-full"></div>
              Connect With Us
            </h3>
            <p className="text-gray-300 text-sm mb-5">
              Join our community and stay updated with the latest opportunities.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.linkedin.com/company/recruiterv/" 
                className="group bg-blue-600/20 hover:bg-blue-600 p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50" 
                aria-label="LinkedIn"
              >
                <Linkedin size={22} className="text-blue-400 group-hover:text-white transition-colors" />
              </a>
              <a 
                href="#" 
                className="group bg-blue-400/20 hover:bg-blue-400 p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-blue-400/50" 
                aria-label="Twitter"
              >
                <Twitter size={22} className="text-blue-300 group-hover:text-white transition-colors" />
              </a>
              <a 
                href="#" 
                className="group bg-blue-700/20 hover:bg-blue-700 p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-blue-700/50" 
                aria-label="Facebook"
              >
                <Facebook size={22} className="text-blue-500 group-hover:text-white transition-colors" />
              </a>
              {/* Android app download */}
              <a
                href="/get-app"
                className="group bg-green-600/20 hover:bg-green-600 p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-green-500/50"
                aria-label="Get the Android app"
                title="Get the Android app"
              >
                <Smartphone size={22} className="text-green-400 group-hover:text-white transition-colors" />
              </a>
            </div>

            {/* Call to Action */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-600/30 to-orange-600/30 rounded-xl border border-blue-500/30">
              <p className="text-sm text-gray-200 mb-3 font-medium">Ready to get started?</p>
              <Link 
                to="/reg"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span>Join Now</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-gray-700/50 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} <span className="text-white font-semibold">RecruiterV</span>. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link>
              <span className="text-gray-600">•</span>
              <Link to="/terms" className="hover:text-orange-400 transition-colors">Terms of Service</Link>
              <span className="text-gray-600">•</span>
              <Link to="/contact" className="hover:text-orange-400 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer