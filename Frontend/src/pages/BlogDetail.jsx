import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Eye, 
  ArrowLeft,
  Share2,
  Loader2,
  BookOpen,
  Tag
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const BlogDetail = () => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/blog/${id}`);
      setBlog(response.data.blog);
      
      // Increment view counter
      await axios.put(`/blog/${id}/view`).catch(err => {
        console.error('Error incrementing views:', err);
      });
    } catch (err) {
      console.error('Error fetching blog:', err);
      setError('Blog not found');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: blog.excerpt || blog.content.substring(0, 200),
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Blog Not Found</h2>
            <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg font-semibold"
            >
              <ArrowLeft size={20} />
              <span>Back to Blogs</span>
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30">
      <Header />

      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <button
          onClick={() => navigate('/blog')}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Blogs</span>
        </button>
      </div>

      {/* Blog Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Featured Image */}
          {blog.imageUrl && (
            <div className="h-96 overflow-hidden">
              <img
                src={blog.imageUrl}
                alt={blog.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.parentElement.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-blue-400 to-orange-400 flex items-center justify-center">
                      <svg class="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                  `;
                }}
              />
            </div>
          )}

          <div className="p-8 md:p-12">
            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    <Tag size={14} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {blog.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b-2 border-gray-200">
              <div className="flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                <span className="font-medium">{blog.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye size={20} className="text-blue-600" />
                <span>{blog.views || 0} views</span>
              </div>
              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-300 font-medium"
              >
                <Share2 size={18} />
                <span>Share</span>
              </button>
            </div>

            {/* Excerpt */}
            {blog.excerpt && (
              <div className="bg-gradient-to-r from-blue-50 to-orange-50 border-l-4 border-blue-600 p-6 rounded-r-xl mb-8">
                <p className="text-lg text-gray-700 italic leading-relaxed">
                  {blog.excerpt}
                </p>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-700 leading-relaxed"
                style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.75rem'
                }}
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>

            {/* Author Info */}
            <div className="mt-12 pt-8 border-t-2 border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">
                    {blog.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Written by {blog.author}
                  </h3>
                  <p className="text-gray-600">
                    Published on {formatDate(blog.publishedAt || blog.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Share Again */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-gray-700 font-medium">
                  Found this article helpful? Share it with others!
                </p>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg font-semibold"
                >
                  <Share2 size={20} />
                  <span>Share Article</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Blogs Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold border-2 border-blue-200"
          >
            <ArrowLeft size={20} />
            <span>Back to All Blogs</span>
          </button>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogDetail;
