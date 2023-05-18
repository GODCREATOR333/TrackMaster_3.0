const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

// Create the express app
const app = express();

// Set up the middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

// Set up the database connection
mongoose.connect('mongodb://bokkasaiganesh:VB2pL7elMTZr36tO@ac-6oq4bws-shard-00-00.odfwzrm.mongodb.net:27017,ac-6oq4bws-shard-00-01.odfwzrm.mongodb.net:27017,ac-6oq4bws-shard-00-02.odfwzrm.mongodb.net:27017/?replicaSet=atlas-b55mzv-shard-0&ssl=true&authSource=admin', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Set up the user model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model('User', userSchema);

passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return done(null, false);
      }
      bcrypt.compare(password, user.password)
        .then((isMatch) => {
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        })
        .catch((err) => {
          return done(err);
        });
    })
    .catch((err) => {
      return done(err);
    });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'signin.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/dashboard.html'));
});


// Define the signup route
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => {
      const newUser = new User({
        username: username,
        email: email,
        password: hash,
      });
      return newUser.save();
    })
    .then(() => {
      res.redirect('/signin'); // Redirect to the sign-in page upon successful signup
    })
    .catch((err) => {
      if (err.code === 11000) {
        if (err.keyPattern.username) {
          res.status(400).send('Username already taken.'); // Username is already taken
        } else if (err.keyPattern.email) {
          res.status(400).send('Email already in use.'); // Email is already in use
        }
      } else {
        console.error(err);
        res.status(500).send('An error occurred during signup.');
      }
    });
});
// Define the sign-in route
app.post('/signin', (req, res, next) => {
  passport.authenticate('local', { usernameField: 'email' }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('/signin'); // Redirect to the sign-in page if authentication fails
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/dashboard'); // Redirect to the dashboard page upon successful sign-in
    });
  })(req, res, next);
});
// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
