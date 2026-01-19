'use client';
 
import { useActionState } from 'react';
import { register } from '@/app/lib/actions';
 
export default function Page() {
  const [errorMessage, formAction, isPending] = useActionState(
    register,
    undefined,
  );
 
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-900 dark:text-white">
          Register
        </h1>
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="username">
              Username
            </label>
            <input
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              id="username"
              type="text"
              name="username"
              placeholder="Choose a username"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="password">
              Password
            </label>
            <input
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              id="password"
              type="password"
              name="password"
              placeholder="Choose a password"
              required
              minLength={6}
            />
          </div>
           <div
            className="flex h-8 items-end space-x-1"
            aria-live="polite"
            aria-atomic="true"
          >
            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}
          </div>
          <button
            className="w-full text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
            aria-disabled={isPending}
          >
             {isPending ? 'Registering...' : 'Register'}
          </button>
           <div className="text-sm text-center text-gray-500 dark:text-gray-400">
            Already have an account? <a href="/login" className="text-blue-600 hover:underline dark:text-blue-500">Log in</a>
          </div>
        </form>
      </div>
    </div>
  );
}
