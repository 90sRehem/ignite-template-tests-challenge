import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";

import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Create Statement", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);

    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
  });

  it("should be able to add a new deposit for user", async () => {
    const userData = {
      name: "Test Name",
      email: "Test Email",
      password: "Test Password",
    };

    const user = await createUserUseCase.execute(userData);

    const statement: ICreateStatementDTO = {
      user_id: user.id,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "depósito",
    };

    const statementCreated = await createStatementUseCase.execute(statement);

    expect(statementCreated).toHaveProperty("id");
    expect(statementCreated).toHaveProperty("created_at");
    expect(statementCreated.created_at).not.toBeNull();
  });

  it("should be able to add a new witdraw for an user with sufficient funds", async () => {
    const userData = {
      name: "Test Name",
      email: "Test Email",
      password: "Test Password",
    };

    const user = await createUserUseCase.execute(userData);

    const statementDeposit: ICreateStatementDTO = {
      user_id: user.id,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "depósito",
    };

    await createStatementUseCase.execute(statementDeposit);

    const statementWitdraw: ICreateStatementDTO = {
      user_id: user.id,
      type: OperationType.WITHDRAW,
      amount: 100,
      description: "saque",
    };

    const statementCreated = await createStatementUseCase.execute(
      statementWitdraw
    );

    expect(statementCreated).toHaveProperty("id");
    expect(statementCreated).toHaveProperty("created_at");
    expect(statementCreated.created_at).not.toBeNull();
  });

  it("should NOT be able to add a new witdraw for an user with insufficient funds", async () => {
    const userData = {
      name: "Test Name",
      email: "Test Email",
      password: "Test Password",
    };

    const user = await createUserUseCase.execute(userData);

    const statementWitdraw: ICreateStatementDTO = {
      user_id: user.id,
      type: OperationType.WITHDRAW,
      amount: 100,
      description: "saque",
    };

    await expect(
      createStatementUseCase.execute(statementWitdraw)
    ).rejects.toEqual(new CreateStatementError.InsufficientFunds());
  });

  it("should NOT be able to add a new deposit for a non-existing user", async () => {

    const statementWitdraw: ICreateStatementDTO = {
      user_id: 'user.id',
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "depósito",
    };

    await expect(
      createStatementUseCase.execute(statementWitdraw)
    ).rejects.toEqual(new CreateStatementError.UserNotFound());
  });

  it("should NOT be able to add a new witdraw for a non-existing user", async () => {

    const statementWitdraw: ICreateStatementDTO = {
      user_id: 'user.id',
      type: OperationType.WITHDRAW,
      amount: 100,
      description: "saque",
    };

    await expect(
      createStatementUseCase.execute(statementWitdraw)
    ).rejects.toEqual(new CreateStatementError.UserNotFound());
  });
});
