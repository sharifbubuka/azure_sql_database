if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mssql = require('mssql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const methodoverride = require('method-override');
const initializePassport = require('./passport-config');
const database = require('./db');
const mssqlConnection = require('./db');

// In a production environment, use Mongodb or Microsoft SQL database here
const users = [];
const port = process.env.PORT || 3000;

initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodoverride('_method'));
app.use(bodyParser.json());

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs', { message: flash.message });
});

app.post(
  '/login',
  checkNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
  })
);

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
  // const salt = bcrypt.genSaltSync(10);
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    // users.push({
    //   id: Date.now().toString(),
    //   name: req.body.name,
    //   email: req.body.email,
    //   password: hashedPassword,
    //   // bcrypt synchronous usage
    //   // password: bcrypt.hashSync(req.body.password, salt),
    // });
    const checkForTable = 'show tables like profiles';
    const createTable = 'CREATE TABLE profiles (name VARCHAR(255), email VARCHAR(255), password CHAR(10))';

    database.query(checkForTable, (err, tableExists) => {
      if (err) throw err;
      if (!tableExists) {
        database.query(createTable, (err, table) => {
          if (err) throw err;
          console.log('Table created');
          console.log(table);
        });
      }
      const addUser = `INSERT INTO Profiles (name, email, password), VALUES ('${
        req.body.name
      }', '${req.body.email}', '${hashedPassword}')`;
      database.query(addUser, (err, user) => {
        if (!err) throw err;
        console.log(`${req.body.name} was added to the databse successfully.`);
        console.log(user);
      });
    });
    res.redirect('/login');
  } catch {
    res.redirect('/register');
  }
  console.log(users);
});

app.delete('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
