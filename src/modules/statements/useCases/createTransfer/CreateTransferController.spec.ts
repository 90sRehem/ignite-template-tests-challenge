import { hash } from "bcryptjs";
import request from "supertest";
import { v4 as uuid } from "uuid";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;
let id1: string;
let id2: string;

describe("CreateTransfer Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    id1 = uuid();
    id2 = uuid();
    const statementId = uuid();
    const password = await hash("password", 8);

    await connection.query(
      `
        INSERT INTO USERS(id, name, email, password, created_at, updated_at)
        values('${id1}', 'Supertest1', 'email1@supertest.com', '${password}', 'now()', 'now()');

        INSERT INTO USERS(id, name, email, password, created_at, updated_at)
        values('${id2}', 'Supertest2', 'email2@supertest.com', '${password}', 'now()', 'now()');

        INSERT INTO STATEMENTS(id, user_id, description, amount, type, created_at, updated_at)
        values('${statementId}', '${id1}', 'depósito', 500, 'deposit', 'now()', 'now()')
      `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to to add a transfer from an authenticated user", async () => {
    const sessionResponse = await request(app).post("/api/v1/sessions").send({
      email: "email1@supertest.com",
      password: "password",
    });

    const { user, token } = sessionResponse.body;

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${id2}`)
      .send({
        amount: 100,
        description: "transfer description",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const { amount, description, type, id, created_at } = response.body;

    expect(response.status).toBe(201);
    expect(amount).toEqual(100);
    expect(description).toEqual("transfer description");
    expect(type).toEqual("transfer");
    expect(id).not.toBeNull();
    expect(created_at).not.toBeNull();
  });

  it("should NOT be able to add a transfer from a non-authenticated user", async () => {
    const response = await request(app).get(
      `/api/v1/statements/transfers/${id2}`
    );
    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("JWT token is missing!");
  });

  it("should NOT be able to add a transfer to a non-existing user", async () => {
    const sessionResponse = await request(app).post("/api/v1/sessions").send({
      email: "email1@supertest.com",
      password: "password",
    });

    const { user, token } = sessionResponse.body;

    const response = await request(app)
      .post(`/api/v1/statements/transfers/4437bf49-b757-0000-bc42-1dba7c3e0000`)
      .send({
        amount: 100,
        description: "transfer description",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const { message } = response.body;

    expect(response.status).toBe(404);
    expect(message).toEqual("Receiver not found");
  });

  it("should NOT be able to add a transfer with a wrong authenticate token", async () => {
    const response = await request(app).get("/api/v1/statements/deposit").set({
      Authorization: `Bearer TOKEN`,
    });
    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("JWT invalid token!");
  });
});
