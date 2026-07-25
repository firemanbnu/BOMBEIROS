import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;

        const [{ default: prisma }, bcrypt] = await Promise.all([
          import("@/lib/prisma"),
          import("bcryptjs"),
        ]);

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email as string },
          include: { corporacao: true },
        });

        if (!usuario || !usuario.ativo) return null;

        const senhaValida = await bcrypt.compare(
          credentials.senha as string,
          usuario.senhaHash
        );

        if (!senhaValida) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          corporacaoId: usuario.corporacaoId,
          corporacaoNome: usuario.corporacao.nome,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role;
        token.corporacaoId = (user as Record<string, unknown>).corporacaoId;
        token.corporacaoNome = (user as Record<string, unknown>).corporacaoNome;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).role = token.role;
        (session.user as unknown as Record<string, unknown>).corporacaoId = token.corporacaoId;
        (session.user as unknown as Record<string, unknown>).corporacaoNome = token.corporacaoNome;
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
