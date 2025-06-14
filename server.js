const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB error:", err));

// Schemas
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
}));

const Post = mongoose.model('Post', new mongoose.Schema({
  title: String,
  content: String,
  username: String,
  likes: { type: Number, default: 0 },
  comments: { type: [String], default: [] }
}));

// Register route
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === 'admin') return res.status(403).json({ message: 'Cannot register as admin' });
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    await new User({ username, password }).save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create a post
app.post('/posts', async (req, res) => {
  try {
    const { title, content, username } = req.body;
    const newPost = new Post({ title, content, username });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a post (admin or owner only)
app.delete('/posts/:id', async (req, res) => {
  try {
    const { username } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (username === 'admin' || username === post.username) {
      await post.deleteOne();
      return res.status(200).json({ message: 'Post deleted' });
    }
    res.status(403).json({ message: 'Not authorized' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Increment likes by 1
app.put('/posts/:id/likes', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add a comment
app.put('/posts/:id/comments', async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || comment.trim() === '') return res.status(400).json({ message: 'Comment required' });
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: comment } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
