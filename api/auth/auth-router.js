
bcryptjs = require('bcryptjs');

const router = require('express').Router()

const {
  checkUsernameFree,
  checkUsernameExists,
  checkPasswordLength
} = require('./auth-middleware.js');

const Users = require('../users/users-model.js');
const { knexStore } = require('../store-config.js');


// Require `checkUsernameFree`, `checkUsernameExists` and `checkPasswordLength`
// middleware functions from `auth-middleware.js`. You will need them here!


/**
  1 [POST] /api/auth/register { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "user_id": 2,
    "username": "sue"
  }

  response on username taken:
  status 422
  {
    "message": "Username taken"
  }

  response on password three chars or less:
  status 422
  {
    "message": "Password must be longer than 3 chars"
  }
 */
router.post('/register',
  checkUsernameFree,
  checkPasswordLength,
  (req, res) => {
    let registerUser = req.body;

    const rounds = process.env.HASH_ROUNDS || 4;

    const hash = bcryptjs.hashSync(registerUser.password, rounds);

    registerUser.password = hash;

    Users.add(registerUser)
      .then(saved => {
        return res.status(201).json({ data: saved });
      })
      .catch(error => {
        console.log(error);
        return res.status(500).json({ message: "There was an error while saving the user to the database" });
      });
  })

/**
  2 [POST] /api/auth/login { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "message": "Welcome sue!"
  }

  response on invalid credentials:
  status 401
  {
    "message": "Invalid credentials"
  }
 */
router.post('/login', checkUsernameExists, (req, res) => {
  const { username, password } = req.body;

  Users.findBy({ username })
    .then(users => {
      const user = users[0];

      if (user && bcryptjs.compareSync(password, user.password)) {

        req.session.username = user.username;
        req.session.user = true;

        return res.status(200).json({ message: `Welcome ${username}`, session: req.session });

      } else {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

/**
  3 [GET] /api/auth/logout

  response for logged-in users:
  status 200
  {
    "message": "logged out"
  }

  response for not-logged-in users:
  status 200
  {
    "message": "no session"
  }
 */
// router.get('/logout', (req, res) => {
//   if (req.session) {
//     req.session.destroy()
//     return res.status(200).json({ message: "logged out" })
//   }
//   if (!req.session) {
//     return res.status(200).json({ message: "no session" })
//   }
// })

router.get('/logout', (req, res) => {
  if (req.session && req.session.user) {
    knexStore.destroy(req.sessionID)
    req.session.destroy(err => {
      if (err) {
        res.status(500).json({ Message: "error logging out, please try again later" })
      } else {
        res.clearCookie("chocolatechip")
        res.status(204).end()
      }
    })

  } else {
    res.status(200).json({ Message: "already logged out" })
  }

});

// Don't forget to add the router to the `exports` object so it can be required in other modules
module.exports = router;