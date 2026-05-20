const { db } = require("../router/firebase_ad");

const blogsCollection = db.collection("blogs");
const counterRef = db.collection("meta").doc("blog_counter");

/**
 * Get current blog ID counter and increment
 */
const getNextBlogId = async () => {
  return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);

    let lastId = 1000;

    if (doc.exists && typeof doc.data().lastBlogId === "number") {
      lastId = doc.data().lastBlogId;
    }

    const nextId = lastId + 1;

    if (doc.exists) {
      transaction.update(counterRef, { lastBlogId: nextId });
    } else {
      transaction.set(counterRef, { lastBlogId: nextId });
    }

    return `BLOG-${nextId}`;
  });
};

/**
 * Create a new blog post
 */
const createBlog = async (data) => {
  try {
    const blogId = await getNextBlogId();
    
    const blogData = {
      blog_id: blogId,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || data.content.substring(0, 200) + "...",
      author: data.author,
      authorEmail: data.authorEmail,
      imageUrl: data.imageUrl || "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: data.status || "draft",
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: data.status === "published" ? new Date() : null
    };

    const docRef = await blogsCollection.add(blogData);
    
    return {
      id: docRef.id,
      ...blogData
    };
  } catch (error) {
    console.error("Error creating blog:", error);
    throw error;
  }
};

/**
 * Get all blogs (for admin)
 */
const getAllBlogs = async () => {
  try {
    const snapshot = await blogsCollection.orderBy("createdAt", "desc").get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      publishedAt: doc.data().publishedAt?.toDate()
    }));
  } catch (error) {
    console.error("Error getting all blogs:", error);
    throw error;
  }
};

/**
 * Get published blogs only (for public)
 */
const getPublishedBlogs = async () => {
  try {
    const snapshot = await blogsCollection
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      publishedAt: doc.data().publishedAt?.toDate()
    }));
  } catch (error) {
    console.error("Error getting published blogs:", error);
    throw error;
  }
};

/**
 * Get blog by ID
 */
const getBlogById = async (id) => {
  try {
    const doc = await blogsCollection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      publishedAt: doc.data().publishedAt?.toDate()
    };
  } catch (error) {
    console.error("Error getting blog by ID:", error);
    throw error;
  }
};

/**
 * Get blog by blog_id
 */
const getBlogByBlogId = async (blogId) => {
  try {
    const snapshot = await blogsCollection
      .where("blog_id", "==", blogId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      publishedAt: doc.data().publishedAt?.toDate()
    };
  } catch (error) {
    console.error("Error getting blog by blog_id:", error);
    throw error;
  }
};

/**
 * Update blog
 */
const updateBlog = async (id, data) => {
  try {
    const docRef = blogsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error("Blog not found");
    }
    
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // If status changed to published and wasn't published before
    if (data.status === "published" && doc.data().status !== "published") {
      updateData.publishedAt = new Date();
    }
    
    // Ensure tags is an array
    if (data.tags) {
      updateData.tags = Array.isArray(data.tags) ? data.tags : [];
    }
    
    await docRef.update(updateData);
    
    const updatedDoc = await docRef.get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data().createdAt?.toDate(),
      updatedAt: updatedDoc.data().updatedAt?.toDate(),
      publishedAt: updatedDoc.data().publishedAt?.toDate()
    };
  } catch (error) {
    console.error("Error updating blog:", error);
    throw error;
  }
};

/**
 * Delete blog
 */
const deleteBlog = async (id) => {
  try {
    const docRef = blogsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error("Blog not found");
    }
    
    await docRef.delete();
    return { success: true, message: "Blog deleted successfully" };
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw error;
  }
};

/**
 * Toggle publish status
 */
const togglePublishStatus = async (id) => {
  try {
    const docRef = blogsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error("Blog not found");
    }
    
    const currentStatus = doc.data().status;
    const newStatus = currentStatus === "published" ? "draft" : "published";
    
    const updateData = {
      status: newStatus,
      updatedAt: new Date()
    };
    
    // Set publishedAt when publishing
    if (newStatus === "published") {
      updateData.publishedAt = new Date();
    }
    
    await docRef.update(updateData);
    
    const updatedDoc = await docRef.get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data().createdAt?.toDate(),
      updatedAt: updatedDoc.data().updatedAt?.toDate(),
      publishedAt: updatedDoc.data().publishedAt?.toDate()
    };
  } catch (error) {
    console.error("Error toggling publish status:", error);
    throw error;
  }
};

/**
 * Increment view counter
 */
const incrementViews = async (id) => {
  try {
    const docRef = blogsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error("Blog not found");
    }
    
    const currentViews = doc.data().views || 0;
    await docRef.update({
      views: currentViews + 1
    });
    
    return { success: true, views: currentViews + 1 };
  } catch (error) {
    console.error("Error incrementing views:", error);
    throw error;
  }
};

/**
 * Search blogs by title or tags
 */
const searchBlogs = async (query, publishedOnly = true) => {
  try {
    let blogsQuery = blogsCollection;
    
    if (publishedOnly) {
      blogsQuery = blogsQuery.where("status", "==", "published");
    }
    
    const snapshot = await blogsQuery.get();
    
    // Filter results by query (Firestore doesn't support full-text search)
    const results = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        publishedAt: doc.data().publishedAt?.toDate()
      }))
      .filter(blog => {
        const searchQuery = query.toLowerCase();
        const titleMatch = blog.title.toLowerCase().includes(searchQuery);
        const tagsMatch = blog.tags.some(tag => 
          tag.toLowerCase().includes(searchQuery)
        );
        const contentMatch = blog.content.toLowerCase().includes(searchQuery);
        
        return titleMatch || tagsMatch || contentMatch;
      });
    
    return results;
  } catch (error) {
    console.error("Error searching blogs:", error);
    throw error;
  }
};

/**
 * Get blogs by tag
 */
const getBlogsByTag = async (tag, publishedOnly = true) => {
  try {
    let blogsQuery = blogsCollection.where("tags", "array-contains", tag);
    
    if (publishedOnly) {
      blogsQuery = blogsQuery.where("status", "==", "published");
    }
    
    const snapshot = await blogsQuery.orderBy("createdAt", "desc").get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      publishedAt: doc.data().publishedAt?.toDate()
    }));
  } catch (error) {
    console.error("Error getting blogs by tag:", error);
    throw error;
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getPublishedBlogs,
  getBlogById,
  getBlogByBlogId,
  updateBlog,
  deleteBlog,
  togglePublishStatus,
  incrementViews,
  searchBlogs,
  getBlogsByTag
};
