// models/postmodels.js
import mongoose from "mongoose";

const postsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: 200
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    numberOfLikes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'test'
});

// Static method to create a post
postsSchema.statics.createPost = async function({ title, content }) {
    try {
        const post = new this({
            title,
            content
        });
        const newPost = await post.save();
        return newPost;
    } catch (error) {
        throw new Error('Error creating post: ' + error.message);
    }
};

// Static method to get all posts
postsSchema.statics.getAllPosts = async function() {
    try {
        const posts = await this.find();  // Fetch all posts
        return posts;
    } catch (error) {
        throw new Error('Error retrieving posts: ' + error.message);
    }
};

// ✅ default export for ESM
export default mongoose.model('Posts', postsSchema);
