const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const blogF = require('../model_fire/blogF');

/**
 * Middleware to verify admin authentication
 * Accepts both admin tokens and Super Admin recruiter tokens
 */
const verifyAdmin = async (req, res, next) => {
  const token = req.cookies.__session;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    req.adminEmail = decoded.email;
    
    // Check if this is a Super Admin recruiter
    // Super Admin recruiters are authenticated through the recruiter login
    // but have elevated privileges
    const recruiterF = require('../model_fire/recruiterF');
    try {
      const recruiter = await recruiterF.findRecruiterByEmail(decoded.email);
      if (recruiter && recruiter.roleCategory === 'Super Admin') {
        // Super Admin has access
        return next();
      }
    } catch (err) {
      // Not a recruiter, might be regular admin - continue to check
    }
    
    // If not a Super Admin recruiter, verify as regular admin
    const adminCF = require('../model_fire/adminCF');
    const adminResult = await adminCF.checkData(decoded.email);
    
    if (adminResult.success) {
      return next();
    }
    
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

/**
 * POST /blog/create - Create new blog (admin only)
 */
router.post('/create', verifyAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, author, authorEmail, imageUrl, tags, status } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const blogData = {
      title,
      content,
      excerpt,
      author: author || "Admin",
      authorEmail: authorEmail || req.adminEmail,
      imageUrl,
      tags: tags || [],
      status: status || "draft"
    };

    const newBlog = await blogF.createBlog(blogData);

    return res.status(201).json({
      message: "Blog created successfully",
      blog: newBlog
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    return res.status(500).json({ message: "Failed to create blog", error: error.message });
  }
});

/**
 * GET /blog/all - Get all blogs (admin only)
 */
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const blogs = await blogF.getAllBlogs();
    return res.json({
      message: "Blogs retrieved successfully",
      blogs,
      count: blogs.length
    });
  } catch (error) {
    console.error("Error getting all blogs:", error);
    return res.status(500).json({ message: "Failed to retrieve blogs", error: error.message });
  }
});

/**
 * GET /blog/published - Get published blogs (public)
 */
router.get('/published', async (req, res) => {
  try {
    const blogs = await blogF.getPublishedBlogs();
    return res.json({
      message: "Published blogs retrieved successfully",
      blogs,
      count: blogs.length
    });
  } catch (error) {
    console.error("Error getting published blogs:", error);
    return res.status(500).json({ message: "Failed to retrieve published blogs", error: error.message });
  }
});

/**
 * GET /blog/search - Search blogs (public)
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const blogs = await blogF.searchBlogs(q, true);
    return res.json({
      message: "Search results retrieved successfully",
      blogs,
      count: blogs.length,
      query: q
    });
  } catch (error) {
    console.error("Error searching blogs:", error);
    return res.status(500).json({ message: "Failed to search blogs", error: error.message });
  }
});

/**
 * GET /blog/tag/:tag - Get blogs by tag (public)
 */
router.get('/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const blogs = await blogF.getBlogsByTag(tag, true);
    
    return res.json({
      message: "Blogs retrieved successfully",
      blogs,
      count: blogs.length,
      tag
    });
  } catch (error) {
    console.error("Error getting blogs by tag:", error);
    return res.status(500).json({ message: "Failed to retrieve blogs", error: error.message });
  }
});

/**
 * GET /blog/:id - Get single blog by ID (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to get by document ID first
    let blog = await blogF.getBlogById(id);
    
    // If not found, try by blog_id
    if (!blog) {
      blog = await blogF.getBlogByBlogId(id);
    }

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Only return published blogs to public (unless admin)
    const token = req.cookies.__session;
    let isAdmin = false;

    if (token) {
      try {
        jwt.verify(token, process.env.SECKEY);
        isAdmin = true;
      } catch (err) {
        // Not admin, continue
      }
    }

    if (!isAdmin && blog.status !== "published") {
      return res.status(404).json({ message: "Blog not found" });
    }

    return res.json({
      message: "Blog retrieved successfully",
      blog
    });
  } catch (error) {
    console.error("Error getting blog:", error);
    return res.status(500).json({ message: "Failed to retrieve blog", error: error.message });
  }
});

/**
 * PUT /blog/:id - Update blog (admin only)
 */
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.blog_id;
    delete updateData.createdAt;
    delete updateData.views;

    const updatedBlog = await blogF.updateBlog(id, updateData);

    return res.json({
      message: "Blog updated successfully",
      blog: updatedBlog
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    return res.status(500).json({ message: "Failed to update blog", error: error.message });
  }
});

/**
 * DELETE /blog/:id - Delete blog (admin only)
 */
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blogF.deleteBlog(id);

    return res.json(result);
  } catch (error) {
    console.error("Error deleting blog:", error);
    return res.status(500).json({ message: "Failed to delete blog", error: error.message });
  }
});

/**
 * PUT /blog/:id/publish - Toggle publish status (admin only)
 */
router.put('/:id/publish', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBlog = await blogF.togglePublishStatus(id);

    return res.json({
      message: `Blog ${updatedBlog.status === 'published' ? 'published' : 'unpublished'} successfully`,
      blog: updatedBlog
    });
  } catch (error) {
    console.error("Error toggling publish status:", error);
    return res.status(500).json({ message: "Failed to toggle publish status", error: error.message });
  }
});

/**
 * PUT /blog/:id/view - Increment view counter (public)
 */
router.put('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blogF.incrementViews(id);

    return res.json(result);
  } catch (error) {
    console.error("Error incrementing views:", error);
    return res.status(500).json({ message: "Failed to increment views", error: error.message });
  }
});

module.exports = router;
