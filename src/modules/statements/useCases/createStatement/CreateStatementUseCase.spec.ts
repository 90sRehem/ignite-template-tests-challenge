
import { CreateStatementError } from "./CreateStatementError";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";


let statementsRepositoryInMemory: InMemoryStatementsRepository;
let usersRepositoryInMemory: InMemoryUsersRepository;

let createStatementUseCase: CreateStatementUseCase;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe("Create Statement", () => {
  beforeEach(() => {
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createStatementUseCase = new CreateStatementUseCase(
      usersRepositoryInMemory,
      statementsRepositoryInMemory,
    );
  });
  it("Should be able to create a statement", async () => {
    const userDTO = {
      name: "João das Coves",
      email: "joaodascoves@email.com",
      password: "123senha",
    };
    const user = await usersRepositoryInMemory.create(userDTO);

    const statementDTO = {
      user_id: user.id as string,
      type: OperationType.DEPOSIT,
      description: "teste de deposito",
      amount: 300,

    }
    const statement = await createStatementUseCase.execute(statementDTO)

    expect(statement).toHaveProperty("id");
  });

  it("Shouldn't be able to create a statement to a non-existent user", async () => {
    expect(async () => {
      const statementDTO = {
        user_id: "fake_user_id",
        type: OperationType.DEPOSIT,
        description: "teste de deposito",
        amount: 300,

      }
      const statement = await createStatementUseCase.execute(statementDTO)
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });
  it("Shouldn't be able to create a statement withdraw greater than the balance", async () => {
    expect(
      async () => {
        const userDTO = {
          name: "João das Coves",
          email: "joaodascoves@email.com",
          password: "123senha",
        };
        const user = await usersRepositoryInMemory.create(userDTO);
      const statementDTO = {
        user_id: user.id as string,
        type: OperationType.WITHDRAW,
        description: "teste de deposito",
        amount: 10,

      }
      const statement = await createStatementUseCase.execute(statementDTO)
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });
});
