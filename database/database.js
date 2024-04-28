import mysql from 'mysql2/promise';
import config from '../config.js';

const Role = {
  Diner: 'diner',
  Franchisee: 'franchisee',
  Admin: 'admin',
};

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
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM menu`);
    const rowCount = rows[0].count;
    if (rowCount === 0) {
      const defaultMenu = [
        { title: 'Veggie', description: 'A garden of delight', image: 'pizza1.png', price: 0.0038 },
        { title: 'Pepperoni', description: 'Spicy treat', image: 'pizza2.png', price: 0.0042 },
        { title: 'Margarita', description: 'Essential classic', image: 'pizza3.png', price: 0.0014 },
        { title: 'Crusty', description: 'A dry mouthed favorite', image: 'pizza4.png', price: 0.0024 },
        { title: 'Flat', description: 'Something special', image: 'pizza5.png', price: 0.0028 },
        { title: 'Chared Leopard', description: 'For those with a darker side', image: 'pizza6.png', price: 0.0099 },
      ];

      for (const menuItem of defaultMenu) {
        await connection.execute(`INSERT INTO menu (title, description, price, image) VALUES (?, ?, ?, ?)`, [menuItem.title, menuItem.description, menuItem.price, menuItem.image]);
      }
    }
  }

  async addDefaultUsers(connection) {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM user`);
    const rowCount = rows[0].count;
    if (rowCount === 0) {
      const defaultUsers = [
        { name: 'Rajah Singh', email: 'f@jwt.com', password: 'a', roles: [Role.Franchisee] },
        { name: 'Zara Ahmed', email: 'a@jwt.com', password: 'a', roles: [Role.Admin] },
        { name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [Role.Diner] },
        { name: 'Lila Patel', email: 'lila@jwt.com', password: 'a', roles: [Role.Diner] },
        { name: 'Aiden Kim', email: 'aiden@jwt.com', password: 'a', roles: [Role.Diner] },
        { name: 'Sofia Nguyen', email: 'sofia@jwt.com', password: 'a', roles: [Role.Diner] },
        { name: 'Emilio Costa', email: 'emilio@jwt.com', password: 'a', roles: [Role.Diner] },
        { name: 'Amara Ali', email: 'amara@jwt.com', password: 'a', roles: [Role.Diner] },
        { name: 'Nikolai Petrov', email: 'nikolai@jwt.com', password: 'a', roles: [Role.Franchisee] },
        { name: 'Luna Santos', email: 'luna@jwt.com', password: 'a', roles: [Role.Franchisee] },
      ];

      for (const user of defaultUsers) {
        await connection.execute(`INSERT INTO user (name, email, password) VALUES (?, ?, ?)`, [user.name, user.email, user.password]);
      }

      // We need to enhance the role information and add it to the database here.
      // for (const adminId of admins) {
      //   await connection.execute(`INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)`, [adminId, Role.Admin, franchiseId]);
      // }
    }
  }

  purchaseHistory = [
    {
      diner: '87654321-4321-4def-9abc-987654321def',
      orders: [
        {
          franchiseId: 'e7b6a8f2-4e1d-4d2d-9e8a-3e9c1a2b6d5f',
          storeId: '12345678-1234-4abc-9def-123456789abc',
          date: '2024-03-10T00:00:00Z',
          items: [
            { description: 'Veggie', price: 0.05 },
            { description: 'Margarita', price: 0.00345 },
          ],
        },
      ],
    },
    {
      diner: 'abcdef12-34ab-4def-9abc-abcdef123456',
      orders: [
        {
          franchiseId: 'e7b6a8f2-4e1d-4d2d-9e8a-3e9c1a2b6d5f',
          storeId: '12345678-1234-4abc-9def-123456789abc',
          date: '2023-03-10T00:00:00Z',
          items: [
            { description: 'Pepperoni', price: 0.005 },
            { description: 'Crusty', price: 0.0045 },
          ],
        },
      ],
    },
  ];

  async addDefaultFranchises(connection) {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM franchise`);
    const rowCount = rows[0].count;
    if (rowCount === 0) {
      const franchises = [
        {
          name: 'SuperPie',
          admins: ['12345678-1234-4abc-9def-123456789abc'],

          stores: [
            { name: 'Orem', totalRevenue: 3.0 },
            { name: 'Provo', totalRevenue: 5.3 },
            { name: 'Payson', totalRevenue: 23.2 },
          ],
        },
        {
          name: 'LotaPizza',
          admins: ['01234567-8901-4f4f-9f9f-9876543210ab', '65432109-8765-4e4e-9e9e-0123456789ab'],

          stores: [
            { name: 'Lehi', totalRevenue: 0.25 },
            { name: 'Springville', totalRevenue: 1.9 },
            { name: 'American Fork', totalRevenue: 4.802 },
          ],
        },
        {
          name: 'PizzaCorp',
          admins: ['65432109-8765-4e4e-9e9e-0123456789ab'],

          stores: [{ name: 'Spanish Fork', totalRevenue: 3000000 }],
        },
      ];

      for (const franchise of franchises) {
        const [franchiseResult] = await connection.execute(`INSERT INTO franchise (name) VALUES (?)`, [franchise.name]);
        const franchiseId = franchiseResult.insertId;
        for (const store of franchise.stores) {
          await connection.execute(`INSERT INTO store (franchiseId, name) VALUES (?, ?)`, [franchiseId, store.name]);
        }
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
        CREATE TABLE IF NOT EXISTS user (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL
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

      await connection.query(`
        CREATE TABLE IF NOT EXISTS franchise (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS store (
          id INT AUTO_INCREMENT PRIMARY KEY,
          franchiseId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          FOREIGN KEY (franchiseId) REFERENCES franchise(id)
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS userRole (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          role VARCHAR(255) NOT NULL,
          objectId INT NOT NULL,
          FOREIGN KEY (userId) REFERENCES user(id),
          INDEX (objectId)
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS dinerOrder (
          id INT AUTO_INCREMENT PRIMARY KEY,
          dinerId INT NOT NULL,
          franchiseId INT NOT NULL,
          storeId INT NOT NULL,
          date DATETIME NOT NULL,
          FOREIGN KEY (dinerId) REFERENCES user(id),
          FOREIGN KEY (franchiseId) REFERENCES franchise(id),
          FOREIGN KEY (storeId) REFERENCES store(id)
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS orderItem (
          id INT AUTO_INCREMENT PRIMARY KEY,
          orderId INT NOT NULL,
          itemId INT NOT NULL,
          description VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (orderId) REFERENCES dinerOrder(id),
          FOREIGN KEY (itemId) REFERENCES menu(id)
        )
      `);

      await this.addDefaultMenu(connection);
      await this.addDefaultFranchises(connection);
      await this.addDefaultUsers(connection);

      console.log('Database initialized successfully');
    } catch (err) {
      console.error('Error initializing database:', err.message);
    }
  }
}

export default new DB();
