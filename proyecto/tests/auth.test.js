const request = require("supertest");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB
} = require("./helpers/testDb");

let app;

async function registerUser(usuario = "sara", password = "123456") {
  return request(app).post("/auth/register").send({ usuario, password });
}

async function loginUser(usuario = "sara", password = "123456") {
  return request(app).post("/auth/login").send({ usuario, password });
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
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("healthcheck", () => {
  test("GET /health responde UP", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, status: "UP" });
  });
});

describe("register", () => {
  test("devuelve token", async () => {
    const res = await registerUser();
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeTruthy();
  });

  test("falla si faltan datos", async () => {
    const res = await request(app).post("/auth/register").send({ usuario: "sara" });
    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).toMatch(/Datos incompletos/);
  });

  test("falla si el usuario ya existe", async () => {
    await registerUser();
    const res = await registerUser("sara", "abcdef");
    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).toMatch(/Usuario ya existe/);
  });
});

describe("login", () => {
  test("devuelve token si credenciales correctas", async () => {
    await registerUser();
    const res = await loginUser();
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test("falla si faltan datos", async () => {
    const res = await request(app).post("/auth/login").send({ usuario: "sara" });
    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).toMatch(/Datos incompletos/);
  });

  test("falla con usuario inexistente", async () => {
    const res = await loginUser("noexiste", "123456");
    expect(res.statusCode).toBe(404);
    expect(res.body.mensaje).toMatch(/Usuario incorrecto/);
  });

  test("falla con password incorrecta", async () => {
    await registerUser();
    const res = await loginUser("sara", "xxxxxx");
    expect(res.statusCode).toBe(401);
    expect(res.body.mensaje).toMatch(/incorrecta/i);
  });
});

describe("logins", () => {
  test("GET /auth/logins devuelve [] al inicio", async () => {
    const res = await request(app).get("/auth/logins");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("GET /auth/logins aplica limit y ordena por createdAt desc", async () => {
    await registerUser("user1", "123456");
    await registerUser("user2", "123456");
    await loginUser("user1", "123456");
    await loginUser("user2", "123456");

    const res = await request(app).get("/auth/logins?limit=1");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].usuario).toBe("user2");
  });
});

describe("logout", () => {
  test("requiere token", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.statusCode).toBe(401);
  });

  test("valida formato Bearer", async () => {
    const res = await request(app).post("/auth/logout").set("Authorization", "Token abc");
    expect(res.statusCode).toBe(401);
  });

  test("con token devuelve 200", async () => {
    const reg = await registerUser();
    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", "Bearer " + reg.body.token);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/cerrada/i);
  });
});
