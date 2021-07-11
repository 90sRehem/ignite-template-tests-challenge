import { hash } from "bcryptjs";
import request from "supertest";
import { v4 as uuid } from "uuid";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("CreateStatement Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuid();
    const password = await hash("password", 8);

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at, updated_at)
        values('${id}', 'Supertest', 'email@supertest.com', '${password}', 'now()', 'now()')
      `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to get add a deposit from an authenticate user", async () => {
    const sessionResponse = await request(app).post("/api/v1/sessions").send({
      email: "email@supertest.com",
      password: "password",
    });

    const { user, token } = sessionResponse.body;
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
        description: "deposit description",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const { amount, description, type, id, created_at } = response.body;

    expect(response.status).toBe(201);
    expect(amount).toEqual(100);
    expect(description).toEqual("deposit description");
    expect(type).toEqual("deposit");
    expect(id).not.toBeNull();
    expect(created_at).not.toBeNull();
  });

  it("should be able to get add a withdraw from an authenticate user", async () => {
    const sessionResponse = await request(app).post("/api/v1/sessions").send({
      email: "email@supertest.com",
      password: "password",
    });

    const { user, token } = sessionResponse.body;

    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
        description: "deposit description",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 100,
        description: "withdraw description",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const { amount, description, type, id, created_at } = response.body;

    expect(response.status).toBe(201);
    expect(amount).toEqual(100);
    expect(description).toEqual("withdraw description");
    expect(type).toEqual("withdraw");
    expect(id).not.toBeNull();
    expect(created_at).not.toBeNull();
  });

  it("should NOT be able to add a deposit from a non-authenticate user", async () => {
    const response = await request(app).get("/api/v1/statements/deposit");
    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("JWT token is missing!");
  });

  it("should NOT be able to add a deposit with a wrong authenticate token", async () => {
    const response = await request(app).get("/api/v1/statements/deposit").set({
      Authorization: `Bearer TOKEN`,
    });
    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("JWT invalid token!");
  });

  it("should NOT be able to add a withdraw from a non-authenticate user", async () => {
    const response = await request(app).get("/api/v1/statements/withdraw");
    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("JWT token is missing!");
  });

  it("should NOT be able to add a withdraw with a wrong authenticate token", async () => {
    const response = await request(app).get("/api/v1/statements/withdraw").set({
      Authorization: `Bearer TOKEN`,
    });
    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("JWT invalid token!");
  });
});
