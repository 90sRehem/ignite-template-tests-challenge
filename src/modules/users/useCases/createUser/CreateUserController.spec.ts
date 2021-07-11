import request from "supertest";

import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Create User", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create a new user", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "Supertest",
      email: "email@supertest.com",
      password: "password",
    });

    expect(response.status).toBe(201);
  });

  it("should not be able to create a new user with an already exists email", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Supertest",
      email: "email@supertest.com",
      password: "password",
    });

    const response = await request(app).post("/api/v1/users").send({
      name: "Supertest",
      email: "email@supertest.com",
      password: "password",
    });

    const { message } = response.body;

    expect(response.status).toBe(400);
    expect(message).toEqual("User already exists");
  });
});
