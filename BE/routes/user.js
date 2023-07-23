const express = require("express");
const router = express.Router();
const md5 = require("md5");
const jwt = require("jsonwebtoken");

const Pool = require("pg").Pool;

// Below config for docker
const pool = new Pool({
  user: "postgres",
  host: "timescaledb",
  database: "postgres",
  password: "password",
  port: 5432,
});

// Below config for localhost
// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "nikola",
//   password: "password",
//   port: 5436,
// });

router.post("/register", async function (req, res, next) {
  try {
    let { username, email, password } = req.body;

    const getUsers = (req, res) => {
      pool.query("SELECT * FROM users ORDER BY id ASC", (error, results) => {
        if (error) {
          throw error;
        }
      });
    };

    const createUser = (hashed_password) => {
      pool.query(
        "INSERT INTO users (id, username, email, password, created_on) VALUES ((SELECT MAX(id)+1 FROM public.users), $1, $2, $3, $4) RETURNING *",
        [username, email, hashed_password, new Date()],
        (error, results) => {
          if (error) {
            throw error;
          }
          let token = jwt.sign({ data: results }, "secret");
          res.send({ status: 1, data: results, token: token });
        }
      );
    };
    // getUsers();

    const hashed_password = md5(password.toString());
    const checkUsername = `Select * FROM users WHERE email = '${email}'`;
    pool.query(checkUsername, (error, results) => {
      if (error) {
        throw error;
      }
      if (results?.rows?.length > 0) {
        res.send({ status: 0, msg: "Email already used!" });
      } else {
        createUser(hashed_password);
      }
    });
  } catch (error) {
    res.send({ status: 0, error: error });
  }
});
router.post("/login", async function (req, res, next) {
  let { username, password } = req.body;
  const findUser = () => {
    const query = `SELECT * FROM users WHERE username = '${username}'`;
    return new Promise((resolve, reject) => {
      pool.query(query, (error, results) => {
        if (error) {
          return reject(error);
        }
        return resolve(results);
      });
    });
  };

  try {
    let userDetails = await findUser();
    if (userDetails?.rows?.length == 0) {
      res.send({ status: 0, msg: "Please enter valid username." });
    } else {
      const hashed_password = md5(password.toString());
      if (userDetails?.rows[0]?.password == hashed_password) {
        let token = jwt.sign({ data: userDetails }, "secret", {
          expiresIn: "1h",
        });
        res.send({ status: 1, data: userDetails, token: token });
      } else {
        res.send({ status: 0, msg: "Please enter correct password." });
      }
    }
  } catch (error) {
    res.send({ status: 0, error: error });
  }
});
module.exports = router;
