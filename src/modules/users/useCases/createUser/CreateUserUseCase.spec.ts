import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";

import { CreateUserUseCase } from "./CreateUserUseCase";

let createUserUseCase: CreateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe("Create User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  });

  it("should be able to create a new user", async () => {
    const user = {
      name: "Test Name",
      email: "Test Email",
      password: "Test Password",
    };

    await createUserUseCase.execute(user);

    const userCreated = await inMemoryUsersRepository.findByEmail(
      user.email
    );

    expect(userCreated).toHaveProperty("id");
  });

  it("should not be able to create a new user with an already exists email", async () => {
    const user = {
      name: "Test Name",
      email: "Test Email",
      password: "Test Password",
    };

    await createUserUseCase.execute(user);

    await expect(createUserUseCase.execute(user)).rejects.toEqual(
      new CreateUserError()
    );
  });
});
