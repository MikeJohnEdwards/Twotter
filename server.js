const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB error:", err));

// Schemas
const UserSchema = new mongoose.Schema({
  username: String,
  password: String
});

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  username: String // who created the post
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.status(400).json({ error: "User already exists" });

  const user = new User({ username, password });
  await user.save();
  res.status(201).json({ message: 'User registered' });
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.status(200).json({ message: 'Login successful' });
});

// Get posts
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

// Delete post
app.delete('/posts/:id', async (req, res) => {
  const { username } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  // Admin can delete any post, regular users only their own
  if (post.username !== username && username !== 'admin') {
    return res.status(403).json({ error: "Not authorized to delete this post" });
  }

  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: "Post deleted" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
