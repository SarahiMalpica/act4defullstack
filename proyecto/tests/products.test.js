const request = require("supertest");
const mongoose = require("mongoose");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB
} = require("./helpers/testDb");

let app;
let token;

async function registerAndGetToken(usuario = "sara", password = "123456") {
  const reg = await request(app).post("/auth/register").send({ usuario, password });
  return reg.body.token;
}

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.NODE_ENV = "test";

  app = require("../src/app");
  await connectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  token = await registerAndGetToken();
});

afterAll(async () => {
  await disconnectTestDB();
});

test("GET /products sin token devuelve 401", async () => {
  const res = await request(app).get("/products");
  expect(res.statusCode).toBe(401);
});

test("GET /products con token invalido devuelve 403", async () => {
  const res = await request(app)
    .get("/products")
    .set("Authorization", "Bearer token.invalido");

  expect(res.statusCode).toBe(403);
});

test("GET /products con formato Authorization invalido devuelve 401", async () => {
  const res = await request(app).get("/products").set("Authorization", "Token invalido");
  expect(res.statusCode).toBe(401);
});

test("POST /products falla si faltan campos requeridos", async () => {
  const res = await request(app)
    .post("/products")
    .set("Authorization", "Bearer " + token)
    .send({ name: "Teclado" });

  expect(res.statusCode).toBe(400);
  expect(res.body.mensaje).toMatch(/requeridos/i);
});

test("CRUD completo con token", async () => {
  const created = await request(app)
    .post("/products")
    .set("Authorization", "Bearer " + token)
    .send({ name: "Teclado", price: 500, stock: 10, description: "Mecanico" });

  expect(created.statusCode).toBe(201);
  expect(created.body._id).toBeTruthy();
  expect(created.body.createdAt).toBeTruthy();
  expect(created.body.updatedAt).toBeTruthy();
  expect(created.body.createdBy).toBeTruthy();
  expect(created.body.createdBy.usuario).toBe("sara");
  expect(created.body.updatedBy).toBeTruthy();
  expect(created.body.updatedBy.usuario).toBe("sara");

  const id = created.body._id;
  const initialUpdatedAt = created.body.updatedAt;

  const list = await request(app)
    .get("/products")
    .set("Authorization", "Bearer " + token);

  expect(list.statusCode).toBe(200);
  expect(Array.isArray(list.body)).toBe(true);
  expect(list.body.length).toBe(1);

  const getOne = await request(app)
    .get("/products/" + id)
    .set("Authorization", "Bearer " + token);

  expect(getOne.statusCode).toBe(200);
  expect(getOne.body.name).toBe("Teclado");

  const updated = await request(app)
    .put("/products/" + id)
    .set("Authorization", "Bearer " + token)
    .send({ stock: 99 });

  expect(updated.statusCode).toBe(200);
  expect(updated.body.stock).toBe(99);
  expect(updated.body.updatedAt).toBeTruthy();
  expect(updated.body.updatedAt).not.toBe(initialUpdatedAt);
  expect(updated.body.updatedBy).toBeTruthy();
  expect(updated.body.updatedBy.usuario).toBe("sara");

  const deleted = await request(app)
    .delete("/products/" + id)
    .set("Authorization", "Bearer " + token);

  expect(deleted.statusCode).toBe(200);

  const list2 = await request(app)
    .get("/products")
    .set("Authorization", "Bearer " + token);

  expect(list2.statusCode).toBe(200);
  expect(list2.body.length).toBe(0);
});

test("GET /products/:id devuelve 400 con id invalido", async () => {
  const res = await request(app)
    .get("/products/abc")
    .set("Authorization", "Bearer " + token);

  expect(res.statusCode).toBe(400);
});

test("PUT /products/:id devuelve 400 con id invalido", async () => {
  const res = await request(app)
    .put("/products/abc")
    .set("Authorization", "Bearer " + token)
    .send({ stock: 1 });

  expect(res.statusCode).toBe(400);
});

test("DELETE /products/:id devuelve 400 con id invalido", async () => {
  const res = await request(app)
    .delete("/products/abc")
    .set("Authorization", "Bearer " + token);

  expect(res.statusCode).toBe(400);
});

test("GET /products/:id devuelve 404 si no existe", async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();
  const res = await request(app)
    .get("/products/" + fakeId)
    .set("Authorization", "Bearer " + token);

  expect(res.statusCode).toBe(404);
});

test("PUT /products/:id devuelve 404 si no existe", async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();
  const res = await request(app)
    .put("/products/" + fakeId)
    .set("Authorization", "Bearer " + token)
    .send({ stock: 10 });

  expect(res.statusCode).toBe(404);
});

test("DELETE /products/:id devuelve 404 si no existe", async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();
  const res = await request(app)
    .delete("/products/" + fakeId)
    .set("Authorization", "Bearer " + token);

  expect(res.statusCode).toBe(404);
});

test("aislamiento por usuario: no permite leer producto de otro usuario", async () => {
  const tokenA = await registerAndGetToken("userA", "123456");
  const tokenB = await registerAndGetToken("userB", "123456");

  const created = await request(app)
    .post("/products")
    .set("Authorization", "Bearer " + tokenA)
    .send({ name: "Mouse", price: 100, stock: 5 });

  const res = await request(app)
    .get("/products/" + created.body._id)
    .set("Authorization", "Bearer " + tokenB);

  expect(res.statusCode).toBe(404);
});

test("listado global: devuelve productos de todos los usuarios autenticados", async () => {
  const tokenA = await registerAndGetToken("userA", "123456");
  const tokenB = await registerAndGetToken("userB", "123456");

  await request(app)
    .post("/products")
    .set("Authorization", "Bearer " + tokenA)
    .send({ name: "Producto de A", price: 100, stock: 1 });

  await request(app)
    .post("/products")
    .set("Authorization", "Bearer " + tokenB)
    .send({ name: "Producto de B", price: 200, stock: 2 });

  const listA = await request(app).get("/products").set("Authorization", "Bearer " + tokenA);
  const listB = await request(app).get("/products").set("Authorization", "Bearer " + tokenB);

  expect(listA.statusCode).toBe(200);
  expect(listB.statusCode).toBe(200);
  expect(listA.body.length).toBe(2);
  expect(listB.body.length).toBe(2);
  expect(listA.body.map((p) => p.name)).toEqual(expect.arrayContaining(["Producto de A", "Producto de B"]));
  expect(listB.body.map((p) => p.name)).toEqual(expect.arrayContaining(["Producto de A", "Producto de B"]));
  expect(listA.body.every((p) => p.createdBy && p.createdBy.usuario)).toBe(true);
  expect(listA.body.every((p) => p.updatedBy && p.updatedBy.usuario)).toBe(true);
});

test("edicion global: permite actualizar producto de otro usuario y registra updatedBy", async () => {
  const tokenA = await registerAndGetToken("userA", "123456");
  const tokenB = await registerAndGetToken("userB", "123456");

  const created = await request(app)
    .post("/products")
    .set("Authorization", "Bearer " + tokenA)
    .send({ name: "Monitor", price: 1000, stock: 3 });

  const updated = await request(app)
    .put("/products/" + created.body._id)
    .set("Authorization", "Bearer " + tokenB)
    .send({ stock: 7 });

  expect(updated.statusCode).toBe(200);
  expect(updated.body.stock).toBe(7);
  expect(updated.body.createdBy).toBeTruthy();
  expect(updated.body.createdBy.usuario).toBe("userA");
  expect(updated.body.updatedBy).toBeTruthy();
  expect(updated.body.updatedBy.usuario).toBe("userB");
});

test("borrado global: permite eliminar producto de otro usuario", async () => {
  const tokenA = await registerAndGetToken("userA", "123456");
  const tokenB = await registerAndGetToken("userB", "123456");

  const created = await request(app)
    .post("/products")
    .set("Authorization", "Bearer " + tokenA)
    .send({ name: "Laptop", price: 2000, stock: 2 });

  const deleted = await request(app)
    .delete("/products/" + created.body._id)
    .set("Authorization", "Bearer " + tokenB);

  expect(deleted.statusCode).toBe(200);

  const list = await request(app).get("/products").set("Authorization", "Bearer " + tokenA);
  expect(list.statusCode).toBe(200);
  expect(list.body.length).toBe(0);
});
