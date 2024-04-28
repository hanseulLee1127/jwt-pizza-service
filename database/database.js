import mysql from 'mysql2/promise';
import config from '../config.js';

class DB {
  constructor() {
    this.initializeDatabase();
  }

  async getMenu() {
    const rows = await this.query(`SELECT * FROM menu`);
    return rows;
  }

  async getOrders(page = 1) {
    const offset = this.getOffset(page, config.db.listPerPage);
    const rows = await this.query(
      `SELECT id, franchise, store, data 
      FROM dinerOrder LIMIT ${offset},${config.db.listPerPage}`
    );
    const data = this.emptyOrRows(rows);
    const meta = { page };

    return {
      data,
      meta,
    };
  }

  async addOrder(order) {
    const sql = `INSERT INTO dinerOrder (franchise, store, data) VALUES (?, ?, ?)`;
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
    const connection = await mysql.createConnection(config.db.connection);
    const [results] = await connection.execute(sql, params);

    return results;
  }

  async addDefaultMenu(connection) {
    const defaultMenu = [
      { title: 'Veggie', description: 'A garden of delight', image: 'pizza1.png', price: 0.0038 },
      { title: 'Pepperoni', description: 'Spicy treat', image: 'pizza2.png', price: 0.0042 },
      { title: 'Margarita', description: 'Essential classic', image: 'pizza3.png', price: 0.0014 },
      { title: 'Crusty', description: 'A dry mouthed favorite', image: 'pizza4.png', price: 0.0024 },
      { title: 'Flat', description: 'Something special', image: 'pizza5.png', price: 0.0028 },
      { title: 'Chared Leopard', description: 'For those with a darker side', image: 'pizza6.png', price: 0.0099 },
    ];

    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM menu`);
    const rowCount = rows[0].count;
    if (rowCount === 0) {
      for (const menuItem of defaultMenu) {
        await connection.execute(`INSERT INTO menu (title, description, price, image) VALUES (?, ?, ?, ?)`, [menuItem.title, menuItem.description, menuItem.price, menuItem.image]);
      }
    }
  }

  async initializeDatabase() {
    try {
      const connection = await mysql.createConnection({
        host: config.db.connection.host,
        user: config.db.connection.user,
        password: config.db.connection.password,
        connectTimeout: config.db.connection.connectTimeout,
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.db.connection.database}`);

      await connection.query(`USE ${config.db.connection.database}`);

      await connection.query(`
            CREATE TABLE IF NOT EXISTS dinnerOrder (
                id INT AUTO_INCREMENT PRIMARY KEY,
                franchise VARCHAR(255) NOT NULL,
                store VARCHAR(255) NOT NULL,
                data TEXT NOT NULL
            )
      `);

      await connection.query(`
            CREATE TABLE IF NOT EXISTS menu (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              image VARCHAR(1024) NOT NULL,
              price DECIMAL(10, 2) NOT NULL,
              description TEXT NOT NULL
            )
      `);

      await this.addDefaultMenu(connection);

      console.log('Database initialized successfully');
    } catch (err) {
      console.error('Error initializing database:', err.message);
    }
  }
}

export default new DB();
