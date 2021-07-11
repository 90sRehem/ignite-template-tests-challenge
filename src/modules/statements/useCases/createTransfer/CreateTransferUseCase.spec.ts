import { User } from "../../../users/entities/User";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";

import { CreateTransferUseCase } from "./CreateTransferUseCase";
import { ICreateTransferDTO } from "./ICreateTransferDTO";
import { CreateTransferError } from "./CreateTransferError";

let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let createTransferUseCase: CreateTransferUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
  TRANSFER = "transfer",
}

let user1: User;
let user2: User;

describe("Create Transfer", () => {
  beforeEach(async () => {
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

    user1 = await createUserUseCase.execute(userData1);
    user2 = await createUserUseCase.execute(userData2);

    const statement1: ICreateStatementDTO = {
      user_id: user1.id,
      type: OperationType.DEPOSIT,
      amount: 500,
      description: "depósito",
    };

    const statement2: ICreateStatementDTO = {
      user_id: user2.id,
      type: OperationType.DEPOSIT,
      amount: 500,
      description: "depósito",
    };

    await createStatementUseCase.execute(statement1);
    await createStatementUseCase.execute(statement2);
  });

  it("should be able to add a new user transfer", async () => {
    const transfer: ICreateTransferDTO = {
      receiver_id: user1.id,
      user_id: user2.id,
      amount: 100,
      description: "Descrição da transferência",
    };

    const transferCreated = await createTransferUseCase.execute(transfer);

    expect(transferCreated).toHaveProperty("id");
    expect(transferCreated).toHaveProperty("created_at");
    expect(transferCreated.receiver_id).not.toBeNull();
    expect(transferCreated.created_at).not.toBeNull();
  });

  it("should NOT be able to add a new transfer for an user with insufficient funds", async () => {
    const transfer: ICreateTransferDTO = {
      receiver_id: user1.id,
      user_id: user2.id,
      amount: 600,
      description: "Descrição da transferência",
    };

    await expect(createTransferUseCase.execute(transfer)).rejects.toEqual(
      new CreateTransferError.InsufficientFunds()
    );
  });

  it("should NOT be able to add a new transfer to a non-existing user", async () => {
    const transfer: ICreateTransferDTO = {
      receiver_id: "user1.id",
      user_id: user2.id,
      amount: 100,
      description: "Descrição da transferência",
    };

    await expect(createTransferUseCase.execute(transfer)).rejects.toEqual(
      new CreateTransferError.ReceiverNotFound()
    );
  });

  it("should NOT be able to add a new transfer from a non-existing user", async () => {
    const transfer: ICreateTransferDTO = {
      receiver_id: user1.id,
      user_id: "user2.id",
      amount: 100,
      description: "Descrição da transferência",
    };

    await expect(createTransferUseCase.execute(transfer)).rejects.toEqual(
      new CreateTransferError.SenderNotFound()
    );
  });
});
