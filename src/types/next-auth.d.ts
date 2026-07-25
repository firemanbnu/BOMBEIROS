import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      corporacaoId: string;
      corporacaoNome: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    corporacaoId?: string;
    corporacaoNome?: string;
  }
}
