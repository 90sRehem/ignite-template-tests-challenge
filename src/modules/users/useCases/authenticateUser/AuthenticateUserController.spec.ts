import { hash } from "bcryptjs";
import request from "supertest";
import { v4 as uuid } from "uuid";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Authenticate User", () => {
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

  it("should be able to authenticate an existing user", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "email@supertest.com",
      password: "password",
    });

    const { user, token } = response.body;

    expect(response.status).toBe(200);
    expect(user.email).toEqual("email@supertest.com");
    expect(user.name).toEqual("Supertest");
    expect(token).not.toBeNull();
  });

  it("should not be able to authenticate an user with wrong password", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "WRONG_email@supertest.com",
      password: "password",
    });

    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("Incorrect email or password");
  });

  it("should not be able to authenticate a non-existing user", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "email@supertest.com",
      password: "WRONG_password",
    });

    const { message } = response.body;
    expect(response.status).toBe(401);
    expect(message).toEqual("Incorrect email or password");
  });
});
