const mysql = require('mysql2/promise');
const config = require('../config.json').db;

class DB {
  constructor() {
    this.initializeDatabase();
  }

  async getOrders(page = 1) {
    const offset = this.getOffset(page, config.listPerPage);
    const rows = await this.query(
      `SELECT id, franchise, store, data 
      FROM orders LIMIT ${offset},${config.listPerPage}`
    );
    const data = this.emptyOrRows(rows);
    const meta = { page };

    return {
      data,
      meta,
    };
  }

  async addOrder(order) {
    const sql = `INSERT INTO orders (franchise, store, data) VALUES (?, ?, ?)`;
    const result = await this.query(sql, [order.franchise, order.store, order.data]);
    order.id = result.insertId;
    return order;
  }

  getOffset(currentPage = 1, listPerPage) {
    return (currentPage - 1) * [listPerPage];
  }

  emptyOrRows(rows) {
    if (!rows) {
      return [];
    }
    return rows;
  }

  async query(sql, params) {
    const connection = await mysql.createConnection(config.connection);
    const [results] = await connection.execute(sql, params);

    return results;
  }

  async initializeDatabase() {
    try {
      const connection = await mysql.createConnection({
        host: config.connection.host,
        user: config.connection.user,
        password: config.connection.password,
        connectTimeout: config.connection.connectTimeout,
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.connection.database}`);

      await connection.query(`USE ${config.connection.database}`);

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
}

module.exports = new DB();
