const Post = require('../models/postmodels'); // Assuming you have a Post model

const createPost = async (req, res) => {
    try {
        const { title, content } = req.body;

        // Create a new post
        const newPost = await Post.create({ title, content });

        // Send response
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
const getPosts = async (req, res) => {
    try {
        const posts = await Posts.getPosts();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
;
module.exports = { createPost, getPosts };  