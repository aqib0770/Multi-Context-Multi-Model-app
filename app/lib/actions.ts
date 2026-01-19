'use server';
 
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
 
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function register(
    prevState: string | undefined,
    formData: FormData,
) {
    const { username, password } = Object.fromEntries(formData);

    try {
        await dbConnect();
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return 'Username already exists.';
        }

        const hashedPassword = await bcrypt.hash(password as string, 10);
        
        await User.create({
            username,
            password: hashedPassword,
        });

    } catch (error) {
        console.error('Registration error:', error);
        return 'Failed to register.';
    }

    redirect('/login');
}
