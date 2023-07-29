const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

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
//   database: "postgres",
//   password: "password",
//   port: 5436,
// });

router.post("/save", auth.verifyToken, async function (req, res, next) {
  try {
    // console.log(req.body);
    let elm = req.body;
    // elm.start_time = new Date(elm.start_time).toISOString();
    // elm.end_time = new Date(elm.end_time).toISOString();
    let query = `INSERT INTO job_details (machine, job_name, operator_name, shift, target_qty, actual_qty, remarks, updated_by, start_time, end_time)
    VALUES('${elm.machine}', '${elm.job_name}', '${elm.operator_name}', '[${elm.start_time},${elm.end_time})', ${elm.target_qty}, ${elm.actual_qty}, '${elm.remarks}', '${elm.updated_by}', '${elm.start_time}', '${elm.end_time}')`;
    let res = await pool.query(query);

    // let jobs = req.body.jobs;
    // for (let i = 0; i < jobs.length; i++) {
    //   const elm = jobs[i];

    //   let query = `INSERT INTO job_details
    //   VALUES(${elm.id}, '${elm.machine}', '${elm.job_name}', '${elm.operator_name}', '[${elm.start_time},${elm.end_time})', ${elm.target_qty}, ${elm.actual_qty}, '${elm.remarks}', '${elm.updated_by}', '${elm.start_time}', '${elm.end_time}')
    //   ON CONFLICT(id) DO UPDATE SET machine = EXCLUDED.machine, job_name = EXCLUDED.job_name, operator_name = EXCLUDED.operator_name, shift = EXCLUDED.shift, target_qty = EXCLUDED.target_qty, actual_qty = EXCLUDED.actual_qty, remarks = EXCLUDED.remarks, updated_by = EXCLUDED.updated_by, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time`;
    //   let res = await pool.query(query);
    // }
    res.send({ statusCode: 201 });
  } catch (error) {
    res.send({ statusCode: 500, error: error });
  }
});

router.post("/update", auth.verifyToken, async function (req, res, next) {
  try {
    // console.log(req.body);
    let elm = req.body;
    if (elm.id) {
      let updateQuery = `UPDATE job_details
      SET machine = '${elm.machine}', job_name = '${elm.job_name}', operator_name = '${elm.operator_name}', shift = '[${elm.start_time},${elm.end_time})', 
      target_qty = ${elm.target_qty}, actual_qty = ${elm.actual_qty}, remarks = '${elm.remarks}', updated_by = '${elm.updated_by}', start_time = '${elm.start_time}', end_time = '${elm.end_time}'
      WHERE id = ${elm.id};`;
      await pool.query(updateQuery);
    }
    res.send({ statusCode: 200 });
  } catch (error) {
    res.send({ statusCode: 500, error: error });
  }
});

router.get("/get", auth.verifyToken, async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  try {
    // const query = `Select * FROM job_details`;
    // let resData = {
    //   jobs: []
    // }
    // const result = await pool.query(query);
    // console.log(result, 'resData');
    // if (result?.rows?.length > 0) {
    //   result.rows.forEach(element => {
    //     let timeObj = JSON.parse(element.shift.replace(/\)$/,"]"));
    //     resData.jobs.push({
    //       id: element.id,
    //       machine: element.machine,
    //       jobName: element.job_name,
    //       targetQty: element.target_qty,
    //       actualQty: element.actual_qty,
    //       startTime: timeObj.length > 0 ? timeObj[0] : '',
    //       endTime: timeObj.length > 0 ? timeObj[1] : '',
    //       operatorName: element.operator_name,
    //       remarks: element.remarks
    //     });
    //   });
    // }
    // res.send({ status: 1, data: resData });

    const dataQuery = `SELECT * FROM job_details ORDER BY id OFFSET $1 LIMIT $2`;
    const dataResult = await pool.query(dataQuery, [offset, pageSize]);

    const totalCountQuery = `SELECT COUNT(*) FROM job_details`;
    const totalCountResult = await pool.query(totalCountQuery);

    const totalCount = parseInt(totalCountResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / pageSize);

    res.json({
      data: dataResult.rows,
      page,
      pageSize,
      totalCount,
      totalPages,
      statusCode: 200,
    });
  } catch (error) {
    res.send({ status: 0, error: error });
  }
});
module.exports = router;
