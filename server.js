const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB error:", err));

// User schema
const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String
}));

// Post schema
const Post = mongoose.model('Post', new mongoose.Schema({
  title: String,
  content: String,
  username: String
}));

// Register route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Optional: Prevent public registration as 'admin'
  if (username === 'admin') {
    return res.status(403).json({ message: 'Cannot register as admin' });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newUser = new User({ username, password });
  await newUser.save();
  res.status(201).json({ message: 'User registered' });
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.status(200).json({ message: 'Login successful' });
});

// Get all posts
app.get('/posts', async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});

// Create post
app.post('/posts', async (req, res) => {
  const { title, content, username } = req.body;
  const newPost = new Post({ title, content, username });
  await newPost.save();
  res.status(201).json(newPost);
});

// Delete post (admin or owner only)
app.delete('/posts/:id', async (req, res) => {
  const { username } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (username === 'admin' || username === post.username) {
    await post.deleteOne();
    return res.status(200).json({ message: 'Post deleted' });
  } else {
    return res.status(403).json({ message: 'Not authorized to delete this post' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
