import { BalanceMap } from "../../../../modules/statements/mappers/BalanceMap";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { CreateTransferUseCase } from "../createTransfer/CreateTransferUseCase";
import { ICreateTransferDTO } from "../createTransfer/ICreateTransferDTO";
import { GetBalanceError } from "./GetBalanceError";

import { GetBalanceUseCase } from "./GetBalanceUseCase";

let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let createTransferUseCase: CreateTransferUseCase;
let getBalanceUseCase: GetBalanceUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
  TRANSFER = "transfer",
}

describe("Balance", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);

    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );

    createTransferUseCase = new CreateTransferUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );

    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementsRepository,
      inMemoryUsersRepository
    );
  });

  it("should be able to get user's balance", async () => {
    const userData = {
      name: "Test Name",
      email: "Test Email",
      password: "Test Password",
    };

    const user = await createUserUseCase.execute(userData);

    const userBalance = await getBalanceUseCase.execute({ user_id: user.id });

    expect(userBalance).toHaveProperty("balance");
    expect(userBalance).toHaveProperty("statement");
  });

  it("should properly calculate the user's balance", async () => {
    const userData1 = {
      name: "Test Name",
      email: "Test Email",
      password: "Test Password",
    };

    const userData2 = {
      name: "Test Name 2",
      email: "Test Email 2",
      password: "Test Password 2",
    };

    const user1 = await createUserUseCase.execute(userData1);
    const user2 = await createUserUseCase.execute(userData2);

    const statement1: ICreateStatementDTO = {
      user_id: user1.id,
      type: OperationType.DEPOSIT,
      amount: 500,
      description: "dep??sito",
    };

    const statement2: ICreateStatementDTO = {
      user_id: user2.id,
      type: OperationType.DEPOSIT,
      amount: 500,
      description: "dep??sito",
    };

    await createStatementUseCase.execute(statement1);
    await createStatementUseCase.execute(statement2);

    const transfer: ICreateTransferDTO = {
      receiver_id: user1.id,
      user_id: user2.id,
      amount: 100,
      description: "Descri????o da transfer??ncia",
    };

    await createTransferUseCase.execute(transfer);

    const userBalance1 = await getBalanceUseCase.execute({ user_id: user1.id });
    const userBalance2 = await getBalanceUseCase.execute({ user_id: user2.id });

    expect(userBalance1).toHaveProperty("balance");
    expect(userBalance1).toHaveProperty("statement");
    expect(userBalance1.statement.length).toEqual(2);
    expect(userBalance1.balance).toEqual(600);
    expect(userBalance2.balance).toEqual(400);
  });

  it("should not be able to get a non-existing user balance", async () => {
    await expect(
      getBalanceUseCase.execute({ user_id: "user.id " })
    ).rejects.toEqual(new GetBalanceError());
  });
});
