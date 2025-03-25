const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database.js");

let testUserAuthToken;

beforeAll(async () => {
  const testUser = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(testUser);
  testUserAuthToken = loginRes.body.token;
  expectValidJwt(testUserAuthToken);

  await request(app)
    .put("/api/order/menu")
    .send({
      title: "test pizza",
      description: "delicious",
      image: "image.png",
      price: 9.99,
    })
    .set("Authorization", `Bearer ${testUserAuthToken}`);
});

test("getMenu", async () => {
  const addMenuItemResult = await request(app)
    .get("/api/order/menu")
    .set("Authorization", `Bearer ${testUserAuthToken}`);

  expect(addMenuItemResult.status).toBe(200);
  expect(addMenuItemResult.body).toBeInstanceOf(Array);
});

test("addMenuItem", async () => {
  const menuItem = {
    title: "new pizza",
    description: "new pizza description",
    image: "image9.png",
    price: 1.5,
  };

  const addMenuItemResult = await request(app)
    .put("/api/order/menu")
    .send(menuItem)
    .set("Authorization", `Bearer ${testUserAuthToken}`);

  expect(addMenuItemResult.status).toBe(200);
  expect(addMenuItemResult.body).toBeInstanceOf(Array);
});

test("getOrders", async () => {
  const getOrdersResult = await request(app)
    .get("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`);

  expect(getOrdersResult.status).toBe(200);
  expect(getOrdersResult.body).toBeInstanceOf(Object);
});

test("createOrders", async () => {
  const createOrderWithOutAuth = await request(app)
    .post("/api/order")
    .send();

  expect(createOrderWithOutAuth.status).toBe(401);
});

test("createOrdersWithAuth", async () => {
  const exampleOrder = {
    franchiseId: 1,
    storeId: 1,
    items: [
      {
        menuId: 1,
        description: "Veggie",
        price: 0.05,
      },
    ],
  };

  const getOrdersResult = await request(app)
    .post("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .set("Content-Type", "application/json")
    .send(exampleOrder);

  console.log("createOrdersWithAuth response:", getOrdersResult.body);

  expect(getOrdersResult.status).toBe(200);
});

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  user = await DB.addUser(user);
  return { ...user, password: "toomanysecrets" };
}

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
}
