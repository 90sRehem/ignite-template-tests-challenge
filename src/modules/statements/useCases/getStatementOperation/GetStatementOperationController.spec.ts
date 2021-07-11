import { hash } from "bcryptjs";
import request from "supertest";
import { v4 as uuid } from "uuid";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Balance", () => {
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

  it("should be able to get an existing statement operation from an authenticate user", async () => {
    const sessionResponse = await request(app).post("/api/v1/sessions").send({
      email: "email@supertest.com",
      password: "password",
    });

    const { user, token } = sessionResponse.body;

    const statementResponse = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
        description: "deposit description",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const { id: statement_id } = statementResponse.body;

    const response = await request(app)
      .get(`/api/v1/statements/${statement_id}`)
      .send({
        amount: 100,
        description: "deposit description",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const { id, amount, description, type } = response.body;

    expect(response.status).toBe(200);
    expect(amount).toEqual("100.00");
    expect(description).toEqual("deposit description");
    expect(type).toEqual("deposit");
    expect(id).toEqual(statement_id);
  });

  it("should NOT be able to get an non-existing statement operation from an authenticate user", async () => {
    const sessionResponse = await request(app).post("/api/v1/sessions").send({
      email: "email@supertest.com",
      password: "password",
    });

    const { user, token } = sessionResponse.body;

    const statement_id = "dd797a61-87c1-42ca-be70-5721d3613fe2";

    const response = await request(app)
      .get(`/api/v1/statements/${statement_id}`)
      .send({
        amount: 100,
        description: "deposit description",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const { message } = response.body;

    expect(response.status).toBe(404);
    expect(message).toEqual("Statement not found");
  });

  it("should NOT be able to get a statement operation from a non-authenticate user", async () => {
    const statement_id = "dd797a61-87c1-42ca-be70-5721d3613fe2";

    const response = await request(app)
      .get(`/api/v1/statements/${statement_id}`)
      .send({
        amount: 100,
        description: "deposit description",
      });

    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("JWT token is missing!");
  });

  it("should NOT be able to get a statement operation with a wrong authenticate token", async () => {
    const statement_id = "dd797a61-87c1-42ca-be70-5721d3613fe2";
    const response = await request(app)
      .get(`/api/v1/statements/${statement_id}`)
      .set({
        Authorization: `Bearer TOKEN`,
      });
    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("JWT invalid token!");
  });
});
