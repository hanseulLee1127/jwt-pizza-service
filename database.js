const mysql = require('mysql2/promise');
const express = require('express');
const router = express.Router();

router.get('/', async function (req, res, next) {
  try {
    res.json(await getMultiple(req.query.page));
  } catch (err) {
    console.error(`Error while getting programming languages `, err.message);
    next(err);
  }
});

router.post('/', async function (req, res, next) {
  try {
    res.json(await getMultiple(req.query.page));
  } catch (err) {
    console.error(`Error while getting programming languages `, err.message);
    next(err);
  }
});

router.post('/order', async function (req, res, next) {
  try {
    const { franchise, store, data } = req.body;
    const sql = `INSERT INTO orders (franchise, store, data) VALUES (?, ?, ?)`;
    await query(sql, [franchise, store, data]);
    res.sendStatus(200);
  } catch (err) {
    console.error(`Error while adding order: `, err.message);
    next(err);
  }
});

const config = {
  db: {
    host: 'localhost',
    user: 'root',
    password: 'monkeypie',
    database: 'pizza',
    connectTimeout: 60000,
  },
  listPerPage: 10,
};

function getOffset(currentPage = 1, listPerPage) {
  return (currentPage - 1) * [listPerPage];
}

function emptyOrRows(rows) {
  if (!rows) {
    return [];
  }
  return rows;
}

async function query(sql, params) {
  const connection = await mysql.createConnection(config.db);
  const [results] = await connection.execute(sql, params);

  return results;
}

async function initializeDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      connectTimeout: config.db.connectTimeout,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.db.database}`);

    await connection.query(`USE ${config.db.database}`);

    await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                franchise VARCHAR(255) NOT NULL,
                store VARCHAR(255) NOT NULL,
                data TEXT NOT NULL
            )
        `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err.message);
  }
}

initializeDatabase();

async function getMultiple(page = 1) {
  const offset = getOffset(page, config.listPerPage);
  const rows = await query(
    `SELECT id, franchise, store, data 
      FROM orders LIMIT ${offset},${config.listPerPage}`
  );
  const data = emptyOrRows(rows);
  const meta = { page };

  return {
    data,
    meta,
  };
}

module.exports = router;
