import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetStatementOperationError } from "./GetStatementOperationError";

import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("GET Statement", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
  });

  it("should be able to get statement from user", async () => {
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

    const statementOperation = await getStatementOperationUseCase.execute({
      user_id: user.id,
      statement_id: statementCreated.id,
    });

    expect(statementOperation).toHaveProperty("id");
    expect(statementOperation.id).toEqual(statementCreated.id);
    expect(statementOperation).toHaveProperty("created_at");
  });

  it("should NOT be able to get statement from a non-existing user", async () => {
    await expect(
      getStatementOperationUseCase.execute({
        user_id: "userId",
        statement_id: "statementId",
      })
    ).rejects.toEqual(new GetStatementOperationError.UserNotFound());
  });

  it("should NOT be able to get a non-existing statement from user", async () => {
    const userData = {
      name: "Test Name",
      email: "Test Email",
      password: "Test Password",
    };

    const user = await createUserUseCase.execute(userData);

    await expect(
      getStatementOperationUseCase.execute({
        user_id: user.id,
        statement_id: "statementId",
      })
    ).rejects.toEqual(new GetStatementOperationError.StatementNotFound());
  });
});
