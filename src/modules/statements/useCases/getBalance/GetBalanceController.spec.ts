import { hash } from "bcryptjs";
import request from "supertest";
import { v4 as uuid } from "uuid";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;
let id1: string;
let id2: string;

describe("Balance", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    id1 = uuid();
    id2 = uuid();
    const statementId1 = uuid();
    const statementId2 = uuid();
    const statementId3 = uuid();

    const password = await hash("password", 8);

    await connection.query(
      `
        INSERT INTO USERS(id, name, email, password, created_at, updated_at)
        values('${id1}', 'Supertest1', 'email1@supertest.com', '${password}', 'now()', 'now()');

        INSERT INTO USERS(id, name, email, password, created_at, updated_at)
        values('${id2}', 'Supertest2', 'email2@supertest.com', '${password}', 'now()', 'now()');

        INSERT INTO STATEMENTS(id, user_id, description, amount, type, created_at, updated_at)
        values('${statementId1}', '${id1}', 'deposit', 500, 'deposit', 'now()', 'now()');

        INSERT INTO STATEMENTS(id, user_id, description, amount, type, created_at, updated_at)
        values('${statementId2}', '${id1}', 'withdraw', 100, 'withdraw', 'now()', 'now()');

        INSERT INTO STATEMENTS(id, user_id, receiver_id, description, amount, type, created_at, updated_at)
        values('${statementId3}', '${id1}', '${id2}', 'transfer', 100, 'transfer', 'now()', 'now()');
      `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to get balance from an authenticate user", async () => {
    const sessionResponse = await request(app).post("/api/v1/sessions").send({
      email: "email1@supertest.com",
      password: "password",
    });

    const { user, token } = sessionResponse.body;

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`,
      });

    const { statement, balance } = response.body;

    expect(response.status).toBe(200);
    expect(statement.length).toBe(3);
    expect(balance).toEqual(300);
  });

  it("should NOT be able to get balance from a non-authenticated user", async () => {
    const response = await request(app).get("/api/v1/statements/balance");
    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("JWT token is missing!");
  });

  it("should NOT be able to get balance with a wrong authenticate token", async () => {
    const response = await request(app).get("/api/v1/statements/balance").set({
      Authorization: `Bearer TOKEN`,
    });
    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("JWT invalid token!");
  });
});
