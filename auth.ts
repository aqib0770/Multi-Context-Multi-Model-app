import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Google from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import User from "@/models/User";

async function getUserByEmail(email: string) {
  try {
    await dbConnect();
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    console.error("Failed to fetch user by email:", error);
    throw new Error("Failed to fetch user.");
  }
}

async function createOAuthUser(profile: { 
  email: string; 
  name?: string; 
  image?: string; 
  provider: "google" 
}) {
  try {
    await dbConnect();
    const user = await User.create({
      email: profile.email,
      username: profile.name || profile.email.split("@")[0],
      image: profile.image,
      provider: profile.provider,
    });
    return user;
  } catch (error) {
    console.error("Failed to create OAuth user:", error);
    throw new Error("Failed to create user.");
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          console.log("User", user)
          console.log("Account", account)
          console.log("User email from profile:", user.email);
          await dbConnect();
          const existingUser = await getUserByEmail(user.email!);
          console.log("Existing user found:", existingUser);
          if (!existingUser) {
            await createOAuthUser({
              email: user.email!,
              name: user.name || undefined,
              image: user.image || undefined,
              provider: "google",
            });
            console.log("New OAuth user created.");
          }
          return true;
        } catch (error) {
          console.error("Error during OAuth sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // For Google OAuth, fetch the MongoDB user ID
      if (account?.provider === "google" && token.email) {
        await dbConnect();
        const dbUser = await getUserByEmail(token.email);
        if (dbUser) {
          token.sub = dbUser._id.toString();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        // @ts-ignore
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
