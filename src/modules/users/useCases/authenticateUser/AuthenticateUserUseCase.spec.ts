import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";

let authenticateUserUseCase: AuthenticateUserUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
describe("Autenticar Usuário", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(
      usersRepositoryInMemory,
    );
    createUserUseCase = new CreateUserUseCase(
      usersRepositoryInMemory,
    );
  });
  it("Should be able to autenticate a user", async () => {
    const user = {
      name: "João das Coves",
      email: "joaodascoves@email.com",
      password: "123senha",
    };
    await createUserUseCase.execute(user);

    expect(async () => {
      await authenticateUserUseCase.execute({
        email: "joaodascoves@email.com",
        password: "1233senha",
      });
    });
  });

  it("Shouldn't be possible to authenticate a non-existent user", async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: "joaodascoves@email.com",
        password: "123senha",
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it("Shouldn't be possible to authenticate a user with the wrong password", async () => {
    expect(async () => {
      const user = {
        name: "João das Coves",
        email: "joaodascoves@email.com",
        password: "123senha",
        phone: "999999999",
      };

      await createUserUseCase.execute(user);

      await authenticateUserUseCase.execute({
        email: user.email,
        password: "1234senha",
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });
});
