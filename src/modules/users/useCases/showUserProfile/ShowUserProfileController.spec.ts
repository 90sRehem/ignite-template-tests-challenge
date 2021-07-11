import { hash } from "bcryptjs";
import request from "supertest";
import { v4 as uuid } from "uuid";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Profile User", () => {
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

  it("should be able to get user profile from the authenticate user", async () => {
    const sessionResponse = await request(app).post("/api/v1/sessions").send({
      email: "email@supertest.com",
      password: "password",
    });

    const { user, token } = sessionResponse.body;

    const response = await request(app)
      .get("/api/v1/profile")
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(200);
    expect(user.email).toEqual("email@supertest.com");
    expect(user.name).toEqual("Supertest");
    expect(user.id).not.toBeNull();
    expect(user.created_at).not.toBeNull();
  });

  it("should NOT be able to get user profile without the authenticate token", async () => {
    const response = await request(app).get("/api/v1/profile");

    const { message } = response.body;

    expect(response.status).toBe(401);
    expect(message).toEqual("JWT token is missing!");
  });

  it("should NOT be able to get user profile with an wrong authenticate token", async () => {
    const response = await request(app).get("/api/v1/profile").set({
      Authorization: `Bearer TOKEN`,
    });

    const { message } = response.body;

    expect(response.status).toBe(401);
    expect(message).toEqual("JWT invalid token!");
  });
});
