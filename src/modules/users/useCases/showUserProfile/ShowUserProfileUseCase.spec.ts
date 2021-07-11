import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

import { ShowUserProfileError } from "./ShowUserProfileError";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";

let createUserUseCase: CreateUserUseCase;
let showUserProfileUseCase: ShowUserProfileUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe("User Profile", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    showUserProfileUseCase = new ShowUserProfileUseCase(
      inMemoryUsersRepository
    );
  });

  it("should be able to get user profile", async () => {
    const user = {
      name: "Test Name",
      email: "Test Email",
      password: "Test Password",
    };

    await createUserUseCase.execute(user);

    const userCreated = await inMemoryUsersRepository.findByEmail(user.email);

    const userProfile = await showUserProfileUseCase.execute(userCreated.id);

    expect(userProfile).toHaveProperty("id");
    expect(userProfile).toHaveProperty("name");
    expect(userProfile).toHaveProperty("email");
  });

  it("should not be able to get a profile from a non-existing user", async () => {
    await expect(
      showUserProfileUseCase.execute("userCreated.id")
    ).rejects.toEqual(new ShowUserProfileError());
  });
});
