import bcrypt from "bcryptjs";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  playerId?: string;
  googleId?: string;
  avatarUrl?: string;
}

// Seed users (password: "password123" for all demo accounts)
const HASH = bcrypt.hashSync("password123", 10);

export let usersStore: User[] = [
  {
    id: "u1",
    email: "alex.garcia@padel.club",
    name: "Alejandro García",
    passwordHash: HASH,
    createdAt: "2021-03-10T00:00:00Z",
    playerId: "p1",
  },
  {
    id: "u2",
    email: "sofia.m@padel.club",
    name: "Sofia Martínez",
    passwordHash: HASH,
    createdAt: "2021-05-22T00:00:00Z",
    playerId: "p2",
  },
  {
    id: "u3",
    email: "demo@padel.club",
    name: "Demo User",
    passwordHash: HASH,
    createdAt: new Date().toISOString(),
  },
];

export function findUserByEmail(email: string): User | undefined {
  return usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return usersStore.find((u) => u.id === id);
}

export async function createUser(email: string, name: string, password: string): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = {
    id: `u${Date.now()}`,
    email,
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  usersStore.push(user);
  return user;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export function findUserByGoogleId(googleId: string): User | undefined {
  return usersStore.find((u) => u.googleId === googleId);
}

export function createGoogleUser(email: string, name: string, googleId: string, avatarUrl?: string): User {
  const user: User = {
    id: `u${Date.now()}`,
    email,
    name,
    passwordHash: "",
    createdAt: new Date().toISOString(),
    googleId,
    avatarUrl,
  };
  usersStore.push(user);
  return user;
}

export function linkGoogleId(userId: string, googleId: string, avatarUrl?: string): void {
  const user = usersStore.find((u) => u.id === userId);
  if (user) {
    user.googleId = googleId;
    if (avatarUrl) user.avatarUrl = avatarUrl;
  }
}
