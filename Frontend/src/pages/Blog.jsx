import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  User, 
  Eye, 
  Tag,
  ArrowRight,
  Loader2,
  BookOpen
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/blog/published');
      setBlogs(response.data.blogs || []);
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchBlogs();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/blog/search?q=${encodeURIComponent(searchQuery)}`);
      setBlogs(response.data.blogs || []);
    } catch (err) {
      console.error('Error searching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = async (tag) => {
    if (selectedTag === tag) {
      setSelectedTag('');
      fetchBlogs();
      return;
    }

    try {
      setLoading(true);
      setSelectedTag(tag);
      const response = await axios.get(`/blog/tag/${encodeURIComponent(tag)}`);
      setBlogs(response.data.blogs || []);
    } catch (err) {
      console.error('Error fetching blogs by tag:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAllTags = () => {
    const tagsSet = new Set();
    blogs.forEach(blog => {
      if (blog.tags && Array.isArray(blog.tags)) {
        blog.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBlogClick = (blogId) => {
    navigate(`/blog/${blogId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen size={48} />
              <h1 className="text-5xl font-bold">Our Blog</h1>
            </div>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Insights, tips, and stories from the world of recruitment and career development
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 focus:ring-4 focus:ring-blue-300 outline-none shadow-lg"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Tags Filter */}
        {getAllTags().length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Filter by Tags:</h3>
            <div className="flex flex-wrap gap-3">
              {getAllTags().map((tag, index) => (
                <button
                  key={index}
                  onClick={() => handleTagClick(tag)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400'
                  }`}
                >
                  #{tag}
                </button>
              ))}
              {selectedTag && (
                <button
                  onClick={() => {
                    setSelectedTag('');
                    fetchBlogs();
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-full font-medium hover:bg-red-100 transition-all duration-300"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Blog Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              No blogs found
            </h3>
            <p className="text-gray-500">
              {searchQuery || selectedTag
                ? 'Try a different search term or tag'
                : 'Check back soon for new content!'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                onClick={() => handleBlogClick(blog.id)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 group"
              >
                {/* Blog Image */}
                {blog.imageUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={blog.imageUrl}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.parentElement.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-blue-400 to-orange-400 flex items-center justify-center">
                            <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                            </svg>
                          </div>
                        `;
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-orange-400 flex items-center justify-center">
                    <BookOpen size={64} className="text-white" />
                  </div>
                )}

                {/* Blog Content */}
                <div className="p-6">
                  {/* Tags */}
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {blog.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {blog.excerpt || blog.content.substring(0, 150) + '...'}
                  </p>

                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>{blog.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                    </div>
                  </div>

                  {/* Views */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Eye size={16} />
                      <span className="text-sm">{blog.views || 0} views</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                      <span>Read More</span>
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
