import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, Database, User as UserIcon, BookOpen, DollarSign, User, Settings } from "lucide-react";
import axios from "axios";
import { UserStateContext, UserDispatchContext } from "../context/AuthPro";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useContext(UserStateContext);
  const dispatch = useContext(UserDispatchContext);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user?.type === "admin";
  const isRecruiter = user?.type === "recruiter";

  const handleLogout = async () => {
    try {
      if (isAdmin) {
        await axios.post("/admin/adlogout", {}, { withCredentials: true });
      } else {
        await axios.post("/auth/logout", {}, { withCredentials: true });
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      dispatch({ type: "LOGOUT" });
      window.location.href = '/log_rec';
    }
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50 border-b-4 border-gradient-to-r from-blue-600 to-orange-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">

        {/* Logo Section */}
        <div className="flex items-center">
          <div className="relative h-14 w-48 sm:h-16 sm:w-64 transition-all">
            <img
              src="/recuiterv-logo.png"
              alt="RecruiterV Logo"
              className="h-full w-full object-contain hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-3">
          {user ? (
            isAdmin ? (
/* ---------------- ADMIN NAV ---------------- */
              <div className="flex items-center space-x-3" ref={dropdownRef}>
                {/* Profile Avatar with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-orange-50 px-3 py-2 rounded-lg border border-blue-200 hover:shadow-md transition-all"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.name?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <span className="text-gray-800 font-semibold text-sm hidden sm:block">
                      {user?.name}
                    </span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                      {/* User Info Header */}
                      <div className="p-4 bg-gradient-to-r from-blue-600 to-orange-500">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">
                              {user?.name?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-semibold">{user?.name}</p>
                            <p className="text-white/80 text-xs">Administrator</p>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User size={18} className="text-blue-600" />
                          <span className="font-medium">My Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/ad_panel');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard size={18} className="text-green-600" />
                          <span className="font-medium">Dashboard</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/cv_repo');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Database size={18} className="text-orange-600" />
                          <span className="font-medium">Resume DB</span>
                        </button>
                        <div className="border-t border-gray-200 my-2"></div>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={18} />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
/* ---------------- RECRUITER NAV ---------------- */
              <div className="flex items-center space-x-3" ref={dropdownRef}>
                {/* Profile Avatar with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-orange-50 px-3 py-2 rounded-lg border border-blue-200 hover:shadow-md transition-all"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.name?.charAt(0) || 'R'}
                      </span>
                    </div>
                    <span className="text-gray-800 font-semibold text-sm hidden sm:block">
                      {user?.name}
                    </span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                      {/* User Info Header */}
                      <div className="p-4 bg-gradient-to-r from-blue-600 to-orange-500">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">
                              {user?.name?.charAt(0) || 'R'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-semibold">{user?.name}</p>
                            <p className="text-white/80 text-xs">Recruiter</p>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User size={18} className="text-blue-600" />
                          <span className="font-medium">My Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/dash_rec');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard size={18} className="text-green-600" />
                          <span className="font-medium">Dashboard</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/cv_repo');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Database size={18} className="text-orange-600" />
                          <span className="font-medium">Resume DB</span>
                        </button>
                        <div className="border-t border-gray-200 my-2"></div>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={18} />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            /* ---------------- GUEST NAV ---------------- */
            <div className="flex items-center space-x-3">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-300"
              >
                Home
              </Link>

              <Link
                to="/blog"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-300"
              >
                <BookOpen size={18} />
                <span>Blog</span>
              </Link>

              <Link
                to="/about"
                className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-300"
              >
                About Us
              </Link>

              <Link
                to="/pricing"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-300"
              >
                <DollarSign size={18} />
                <span>Pricing</span>
              </Link>

              <Link
                to="/log_rec"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg font-semibold transform hover:-translate-y-0.5"
              >
                <span>Login</span>
              </Link>

              <Link
                to="/reg"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md hover:shadow-lg font-semibold transform hover:-translate-y-0.5"
              >
                <span>Register</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-blue-600 hover:text-orange-500 transition-colors p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-gradient-to-b from-white to-blue-50 border-t-2 border-blue-200 px-4 py-5 space-y-3 shadow-lg">
          {user ? (
            isAdmin ? (
              /* ---------------- ADMIN MOBILE ---------------- */
              <>
                {/* Welcome Section */}
                <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-blue-200 mb-4">
                  <UserIcon size={20} className="text-blue-600" />
                  <span className="text-gray-800 font-semibold">
                    Welcome, {user.name}
                  </span>
                </div>

                {/* Admin Dashboard Button */}
                <button
                  onClick={() => {
                    navigate("/ad_panel");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md font-medium"
                >
                  <LayoutDashboard size={20} />
                  <span>Admin Panel</span>
                </button>

                {/* Resume Database Button */}
                <button
                  onClick={() => {
                    navigate("/cv_repo");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-md font-medium"
                >
                  <Database size={20} />
                  <span>Resume Database</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-3 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 font-medium"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              /* ---------------- RECRUITER MOBILE ---------------- */
              <>
                {/* Welcome Section */}
                <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-blue-200 mb-4">
                  <UserIcon size={20} className="text-blue-600" />
                  <span className="text-gray-800 font-semibold">
                    Welcome, {user.name}
                  </span>
                </div>

                {/* Recruiter Dashboard Button */}
                <button
                  onClick={() => {
                    navigate("/dash_rec");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md font-medium"
                >
                  <LayoutDashboard size={20} />
                  <span>Recruiter Dashboard</span>
                </button>

                {/* Resume Database Button */}
                <button
                  onClick={() => {
                    navigate("/cv_repo");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-md font-medium"
                >
                  <Database size={20} />
                  <span>Resume Database</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-3 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 font-medium"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            )
          ) : (
            /* ---------------- GUEST MOBILE ---------------- */
            <>
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-gray-700 font-medium px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border-2 border-gray-200"
              >
                <span>Home</span>
              </Link>

              <Link
                to="/blog"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-gray-700 font-medium px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border-2 border-gray-200"
              >
                <BookOpen size={20} />
                <span>Blog</span>
              </Link>

              <Link
                to="/about"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-gray-700 font-medium px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border-2 border-gray-200"
              >
                <span>About Us</span>
              </Link>

              <Link
                to="/pricing"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-gray-700 font-medium px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border-2 border-gray-200"
              >
                <DollarSign size={20} />
                <span>Pricing</span>
              </Link>

              <div className="border-t-2 border-gray-300 my-3"></div>

              <Link
                to="/log_rec"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md font-semibold"
              >
                <span>Login</span>
              </Link>

              <Link
                to="/reg"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md font-semibold"
              >
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;