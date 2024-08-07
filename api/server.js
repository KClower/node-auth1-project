const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const bcryptjs = require('bcryptjs');
const session = require("express-session");
const { knexStore } = require('./store-config.js')

const authRouter = require('./auth/auth-router.js');
const usersRouter = require('./users/users-router.js');


/**
  Do what needs to be done to support sessions with the `express-session` package!
  To respect users' privacy, do NOT send them a cookie unless they log in.
  This is achieved by setting 'saveUninitialized' to false, and by not
  changing the `req.session` object unless the user authenticates.

  Users that do authenticate should have a session persisted on the server,
  and a cookie set on the client. The name of the cookie should be "chocolatechip".

  The session can be persisted in memory (would not be adecuate for production)
  or you can use a session store like `connect-session-knex`.
 */

const server = express();


const sessionConfig = {
  name: 'chocolatechip', // default value is sid
  secret: process.env.SESSION_SECRET || 'keep it safe',  // key for encryption
  cookie: {
    maxAge: 1000 * 60 * 10, // how long a cookie is valid for, this would last 10 mins
    secure: process.env.USE_SECURE_COOKIES || false, // send the cookie only over https (secure connection)
    httpOnly: true,  // prevent JS code on client from accessing THIS cookie  
  },
  resave: false,
  saveUninitialized: true, // read docs, it's related to (GDPR compliance) - this a law
  store: knexStore,
};



server.use(helmet());

server.use(cors());
server.use(session(sessionConfig));
server.use(express.json());

server.use('/api/auth', authRouter);
server.use('/api/users', usersRouter);


server.get("/", (req, res) => {
  res.json({ api: "up" });
});



// server.get("/hash", (req, res) => {
//   const password = req.headers.authorization;
//   const secret = req.headers.secret;

//   const hash = hashString(secret)

//   if (password === "melon") {
//     res.json({ welcome: 'friend', secret, hash })
//   } else {
//     res.status(401).json({ Message: "you can not pass!" });
//   }
// });

// function hashString(str) {
//   // use bcryptjs to hash the str argument and return the hash
//   const rounds = process.env.HASH_ROUNDS || 4;
//   const hash = bcryptjs.hashSync(str, rounds)
//   return hash;
// }



server.use((err, req, res, next) => { // eslint-disable-line
  res.status(err.status || 500).json({
    message: err.message,
    stack: err.stack,
  });
});

module.exports = server;
