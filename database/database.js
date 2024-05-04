import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import config from '../config.js';
import { StatusCodeError } from '../endpointHelper.js';

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
    const connection = await this.getConnection();

    const rows = await this.query(connection, `SELECT * FROM menu`);
    return rows;
  }

  async addUser(user) {
    const connection = await this.getConnection();

    user.password = await bcrypt.hash(user.password, 10);

    const userResult = await this.query(connection, `INSERT INTO user (name, email, password) VALUES (?, ?, ?)`, [user.name, user.email, user.password]);
    const userId = userResult.insertId;
    for (const role of user.roles) {
      switch (role.role) {
        case Role.Franchisee: {
          const franchiseId = await this.getID(connection, 'name', role.object, 'franchise');
          await this.query(connection, `INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)`, [userId, role.role, franchiseId]);
          break;
        }
        default: {
          await this.query(connection, `INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)`, [userId, role.role, 0]);
          break;
        }
      }
    }
    return { ...user, id: userId, password: undefined };
  }

  async getUser(email, password) {
    const connection = await this.getConnection();

    const userResult = await this.query(connection, `SELECT * FROM user where email=?`, [email]);
    const user = userResult[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new StatusCodeError('unknown user', 404);
    }

    const roleResult = await this.query(connection, `SELECT * FROM userRole where userId=?`, [user.id]);
    const roles = roleResult.map((r) => {
      return { objectId: r.objectId || undefined, role: r.role };
    });

    return { ...user, roles: roles, password: undefined };
  }

  async getOrders(user, page = 1) {
    const connection = await this.getConnection();

    const offset = this.getOffset(page, config.db.listPerPage);
    const orders = await this.query(connection, `SELECT id, franchiseId, storeId, date FROM dinerOrder WHERE dinerId=? LIMIT ${offset},${config.db.listPerPage}`, [user.id]);
    for (const order of orders) {
      let items = await this.query(connection, `SELECT id, menuId, description, price FROM orderItem WHERE orderId=?`, [order.id]);
      order.items = items;
    }
    return { dinerId: user.id, orders: orders, page };
  }

  async addDinerOrder(user, order) {
    const connection = await this.getConnection();

    const orderResult = await this.query(connection, `INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())`, [user.id, order.franchiseId, order.storeId]);
    const orderId = orderResult.insertId;
    for (const item of order.items) {
      const menuId = await this.getID(connection, 'id', item.menuId, 'menu');
      await this.query(connection, `INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?)`, [orderId, menuId, item.description, item.price]);
    }
    return { id: orderId, ...order };
  }

  async createFranchise(franchise) {
    const connection = await this.getConnection();

    for (const admin of franchise.admins) {
      const adminUser = await this.query(connection, `SELECT id, name FROM user WHERE email=?`, [admin.email]);
      if (adminUser.length == 0) {
        throw new StatusCodeError(`unknown user for franchise admin ${admin.email} provided`, 404);
      }
      admin.id = adminUser[0].id;
      admin.name = adminUser[0].name;
    }

    const franchiseResult = await this.query(connection, `INSERT INTO franchise (name) VALUES (?)`, [franchise.name]);
    franchise.id = franchiseResult.insertId;

    for (const admin of franchise.admins) {
      await this.query(connection, `INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)`, [admin.id, Role.Franchisee, franchise.id]);
    }

    return franchise;
  }

  async deleteFranchise(franchiseId) {
    const connection = await this.getConnection();
    await connection.beginTransaction();
    try {
      await this.query(connection, `DELETE FROM store WHERE franchiseId=?`, [franchiseId]);
      await this.query(connection, `DELETE FROM userRole WHERE objectId=?`, [franchiseId]);
      await this.query(connection, `DELETE FROM franchise WHERE id=?`, [franchiseId]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw new StatusCodeError('unable to delete franchise', 500);
    }
  }

  async getFranchises(authUser) {
    const connection = await this.getConnection();

    const franchises = await this.query(connection, `SELECT id, name FROM franchise`);
    for (const franchise of franchises) {
      if (authUser?.isRole(Role.Admin)) {
        await this.getFranchise(connection, franchise);
      } else {
        franchise.stores = await this.query(connection, `SELECT id, name FROM store WHERE franchiseId=?`, [franchise.id]);
      }
    }
    return franchises;
  }

  async getUserFranchises(userId) {
    const connection = await this.getConnection();
    let franchiseIds = await this.query(connection, `SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?`, [userId]);
    if (franchiseIds.length === 0) {
      return [];
    }

    franchiseIds = franchiseIds.map((v) => v.objectId);
    const franchises = await this.query(connection, `SELECT id, name FROM franchise WHERE id in (${franchiseIds.join(',')})`);
    for (const franchise of franchises) {
      await this.getFranchise(franchise);
    }
    return franchises;
  }

  async getFranchise(franchise) {
    const connection = await this.getConnection();

    franchise.admins = await this.query(connection, `SELECT u.id, u.name, u.email FROM userRole AS ur JOIN user AS u ON u.id=ur.userId WHERE ur.objectId=? AND ur.role='franchisee'`, [franchise.id]);

    franchise.stores = await this.query(
      connection,
      `SELECT s.id, s.name, COALESCE(SUM(oi.price), 0) AS totalRevenue FROM dinerOrder AS do JOIN orderItem AS oi ON do.id=oi.orderId RIGHT JOIN store AS s ON s.id=do.storeId WHERE s.franchiseId=? GROUP BY s.id`,
      [franchise.id]
    );

    return franchise;
  }

  async createStore(franchiseId, store) {
    const connection = await this.getConnection();
    const insertResult = connection.execute(`INSERT INTO store (franchiseId, name) VALUES (?, ?)`, [franchiseId, store.name]);
    return { id: insertResult.insertId, franchiseId, name: store.name };
  }

  async deleteStore(franchiseId, storeId) {
    const connection = await this.getConnection();
    await this.query(connection, `DELETE FROM store WHERE franchiseId=? AND id=?`, [franchiseId, storeId]);
  }

  getOffset(currentPage = 1, listPerPage) {
    return (currentPage - 1) * [listPerPage];
  }

  async query(connection, sql, params) {
    const [results] = await connection.execute(sql, params);
    return results;
  }

  async getID(connection, key, value, table) {
    const [rows] = await connection.execute(`SELECT id FROM ${table} WHERE ${key}=?`, [value]);
    if (rows.length > 0) {
      return rows[0].id;
    }
    throw new Error('No ID found');
  }

  async getConnection(setUse = true) {
    const connection = await mysql.createConnection({
      host: config.db.connection.host,
      user: config.db.connection.user,
      password: config.db.connection.password,
      connectTimeout: config.db.connection.connectTimeout,
      decimalNumbers: true,
    });
    if (setUse) {
      await connection.query(`USE ${config.db.connection.database}`);
    }
    return connection;
  }

  async initializeDatabase() {
    try {
      const connection = await this.getConnection(false);

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
          price DECIMAL(10, 8) NOT NULL,
          description TEXT NOT NULL
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS franchise (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE
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
          INDEX (dinerId),
          INDEX (franchiseId),
          INDEX (storeId)
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS orderItem (
          id INT AUTO_INCREMENT PRIMARY KEY,
          orderId INT NOT NULL,
          menuId INT NOT NULL,
          description VARCHAR(255) NOT NULL,
          price DECIMAL(10, 8) NOT NULL,
          FOREIGN KEY (orderId) REFERENCES dinerOrder(id),
          INDEX (menuId)
        )
      `);

      await this.addDefaultMenu(connection);
      await this.addDefaultFranchises(connection);
      await this.addDefaultUsers(connection);
      await this.addDefaultPurchases(connection);

      console.log('Database initialized successfully');
    } catch (err) {
      console.error('Error initializing database:', err.message, err.stack);
    }
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
        {
          name: 'Rajah Singh',
          email: 'f@jwt.com',
          password: 'a',
          roles: [
            { object: 'SuperPie', role: Role.Franchisee },
            { object: 'PizzaCorp', role: Role.Franchisee },
          ],
        },
        { name: 'Zara Ahmed', email: 'a@jwt.com', password: 'a', roles: [{ role: Role.Admin }] },
        { name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
        { name: 'Lila Patel', email: 'lila@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
        { name: 'Aiden Kim', email: 'aiden@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
        { name: 'Sofia Nguyen', email: 'sofia@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
        { name: 'Emilio Costa', email: 'emilio@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
        { name: 'Amara Ali', email: 'amara@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
        { name: 'Nikolai Petrov', email: 'nikolai@jwt.com', password: 'a', roles: [{ object: 'LotaPizza', role: Role.Franchisee }] },
        { name: 'Luna Santos', email: 'luna@jwt.com', password: 'a', roles: [{ object: 'LotaPizza', role: Role.Franchisee }] },
      ];

      for (const user of defaultUsers) {
        await this.addUser(user);
      }
    }
  }

  async addDefaultPurchases(connection) {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM dinerOrder`);
    const rowCount = rows[0].count;
    if (rowCount === 0) {
      const purchaseHistory = [
        {
          dinerId: 'f@jwt.com',
          orders: [
            {
              franchiseId: 'SuperPie',
              storeId: 'Orem',
              date: '2024-03-10T00:00:00Z',
              items: [
                { description: 'Veggie', price: 0.05 },
                { description: 'Margarita', price: 0.00345 },
              ],
            },
          ],
        },
        {
          dinerId: 'd@jwt.com',
          orders: [
            {
              franchiseId: 'SuperPie',
              storeId: 'Provo',
              date: '2023-03-10T00:00:00Z',
              items: [
                { description: 'Pepperoni', price: 0.005 },
                { description: 'Crusty', price: 0.0045 },
              ],
            },
          ],
        },
      ];

      for (const purchase of purchaseHistory) {
        const dinerId = await this.getID(connection, 'email', purchase.dinerId, 'user');
        for (const order of purchase.orders) {
          const franchiseId = await this.getID(connection, 'name', order.franchiseId, 'franchise');
          const storeId = await this.getID(connection, 'name', order.storeId, 'store');
          const [dinerOrderResult] = await connection.execute(`INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())`, [dinerId, franchiseId, storeId]);
          for (const item of order.items) {
            const menuId = await this.getID(connection, 'title', item.description, 'menu');
            await connection.execute(`INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?)`, [dinerOrderResult.insertId, menuId, item.description, item.price]);
          }
        }
      }
    }
  }

  async addDefaultFranchises(connection) {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM franchise`);
    const rowCount = rows[0].count;
    if (rowCount === 0) {
      const franchises = [
        {
          name: 'SuperPie',
          stores: [
            { name: 'Orem', totalRevenue: 3.0 },
            { name: 'Provo', totalRevenue: 5.3 },
            { name: 'Payson', totalRevenue: 23.2 },
          ],
        },
        {
          name: 'LotaPizza',
          stores: [
            { name: 'Lehi', totalRevenue: 0.25 },
            { name: 'Springville', totalRevenue: 1.9 },
            { name: 'American Fork', totalRevenue: 4.802 },
          ],
        },
        {
          name: 'PizzaCorp',
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
}

const db = new DB();
export { Role, db as DB };
