const mongoose = require('mongoose');

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
postsSchema.statics.createPost = async function(postData) {
    try {
        const post = new this ({
            title,
            content
        });
        const newpost=await post.save();
        return newpost;
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

const postsModel = mongoose.model('Posts', postsSchema);

module.exports = postsModel;
 