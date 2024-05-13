const { Role } = require('../model/model.js');

async function addDefaultMenu(connection, db) {
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

async function addDefaultUsers(connection, db) {
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
      { name: '常用名字', email: 'a@jwt.com', password: 'a', roles: [{ role: Role.Admin }] },
      { name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
      { name: 'Lila Patel', email: 'lila@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
      { name: 'Aiden Kim', email: 'aiden@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
      { name: 'Sofia Nguyen', email: 'sofia@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
      { name: 'Emilio Costa', email: 'emilio@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
      { name: 'Amara Ali', email: 'amara@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
      { name: 'Nikolai Petrov', email: 'nikolai@jwt.com', password: 'a', roles: [{ object: 'LotaPizza', role: Role.Franchisee }] },
      { name: 'عبدالله العمري', email: 'luna@jwt.com', password: 'a', roles: [{ object: 'LotaPizza', role: Role.Franchisee }] },
    ];

    for (const user of defaultUsers) {
      await db.addUser(user);
    }
  }
}

async function addDefaultPurchases(connection, db) {
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
      const dinerId = await db.getID(connection, 'email', purchase.dinerId, 'user');
      for (const order of purchase.orders) {
        const franchiseId = await db.getID(connection, 'name', order.franchiseId, 'franchise');
        const storeId = await db.getID(connection, 'name', order.storeId, 'store');
        const [dinerOrderResult] = await connection.execute(`INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())`, [dinerId, franchiseId, storeId]);
        for (const item of order.items) {
          const menuId = await db.getID(connection, 'title', item.description, 'menu');
          await connection.execute(`INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?)`, [dinerOrderResult.insertId, menuId, item.description, item.price]);
        }
      }
    }
  }
}

async function addDefaultFranchises(connection, db) {
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

async function insertTestData(connection, db) {
  await addDefaultMenu(connection, db);
  await addDefaultFranchises(connection, db);
  await addDefaultUsers(connection, db);
  await addDefaultPurchases(connection, db);
}

module.exports = insertTestData;
