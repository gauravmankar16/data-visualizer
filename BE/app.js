const express = require("express");
const bodyParser = require("body-parser");
const indexRouter = require("./routes/index");
const cors = require("cors");
const app = express();
const path = require('path');

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '/FE/dist')))

app.use("/api", indexRouter);

// Handle all other requests with the Angular app's entry point
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/FE/dist/', 'index.html'));
});

// Below code to be uncommented for listening in localhost
// app.listen(3000, () => {
//   console.log("listening on port 3000");
// });

module.exports = app;
