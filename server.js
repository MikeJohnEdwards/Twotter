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
  username: String,
  password: String
}));

const Post = mongoose.model('Post', new mongoose.Schema({
  title: String,
  content: String,
  username: String,
  likes: { type: Number, default: 0 },
  comments: { type: [String], default: [] }
}));

// Routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin') return res.status(403).json({ message: 'Cannot register as admin' });
  const exists = await User.findOne({ username });
  if (exists) return res.status(400).json({ message: 'User already exists' });
  await new User({ username, password }).save();
  res.status(201).json({ message: 'User registered' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  res.status(200).json({ message: 'Login successful' });
});

app.post('/posts', async (req, res) => {
  const { title, content, username } = req.body;
  const newPost = new Post({ title, content, username });
  await newPost.save();
  res.status(201).json(newPost);
});

app.get('/posts', async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});

app.delete('/posts/:id', async (req, res) => {
  const { username } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (username === 'admin' || username === post.username) {
    await post.deleteOne();
    return res.status(200).json({ message: 'Post deleted' });
  }
  res.status(403).json({ message: 'Not authorized' });
});

app.put('/posts/:id/likes', async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
  res.status(200).json(post);
});

app.put('/posts/:id/comments', async (req, res) => {
  const { comment } = req.body;
  const post = await Post.findByIdAndUpdate(req.params.id, { $push: { comments: comment } }, { new: true });
  res.status(200).json(post);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


