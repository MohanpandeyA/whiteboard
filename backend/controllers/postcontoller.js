// controllers/postcontroller.js
import Post from '../models/postmodels.js';

export const createPost = async (req, res) => {
    try {
        const { title, content } = req.body;
        const newPost = await Post.createPost({ title, content });
        res.status(201).json({
            success: true,
            data: newPost,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to create post',
        });
    }
};

export const getPosts = async (req, res) => {
    try {
        const posts = await Post.getAllPosts();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
