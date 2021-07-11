import { CreateUserError } from "./CreateUserError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";



let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
describe("Create User", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(
      usersRepositoryInMemory,
    );
  });
  it("Should be able to create a user", async () => {
    const userDTO = {
      name: "João das Coves",
      email: "joaodascoves@email.com",
      password: "123senha",
    };
    const user = await createUserUseCase.execute(userDTO);

    expect(user).toHaveProperty("id");
  });

  it("Shouldn't be able to create a usar with the same email", async () => {
    expect(async () => {
      const userDTO = {
        name: "João das Coves",
        email: "joaodascoves@email.com",
        password: "123senha",
      };
      await createUserUseCase.execute(userDTO);
      await createUserUseCase.execute(userDTO);
    }).rejects.toBeInstanceOf(CreateUserError);
  });
});
