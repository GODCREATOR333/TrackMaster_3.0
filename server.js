const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const flash = require('connect-flash');

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
app.use(flash());
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

app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) {
      console.error(err);
      return res.status(500).send('An error occurred during logout.');
    }
    req.flash('successMessage', 'Logged Out successfully.');
    res.redirect('/signin?successMessage=Logged Out successfully.');
  });
});


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
      // Set the success message in the session
      req.flash('successMessage', 'Account created successfully.');
      res.redirect('/signin?successMessage=Account created successfully.');
    })
    .catch((err) => {
      if (err.code === 11000) {
        if (err.keyPattern.username) {
          // Set the error message for username already taken
          req.flash('errorMessage', 'Username already taken.');
          res.redirect('/signup?errorMessage=Username already taken.');
        } else if (err.keyPattern.email) {
          // Set the error message for email already in use
          req.flash('errorMessage', 'Email already in use.');
          res.redirect('/signup?errorMessage=Email already in use.');
        }
      } else {
        console.error(err);
        req.flash('errorMessage', 'An error occurred during signup.');
        res.redirect('/signup?errorMessage=An error occurred during signup.');
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
      req.flash('error', 'Invalid email or password.'); // Set flash message for invalid email or password
      return res.redirect('/signin?errorMessage=Invalid email or password.');
    }
    req.logIn(user, (err) => {
      if (err) {
        req.flash('error', 'Invalid email or password.'); // Set flash message for invalid email or password
        return res.redirect('/signin?errorMessage=Invalid email or password.');
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
