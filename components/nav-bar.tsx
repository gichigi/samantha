'use client'
import Link from 'next/link'
import { useAuth } from './auth-provider'
import LogoutButton from './logout-button'

export default function NavBar() {
  const { user, loading } = useAuth()
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="font-bold text-xl text-blue-600">
              Samantha
            </Link>
          </div>
          
          <div className="flex space-x-4 items-center">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  {user.email}
                </div>
                <LogoutButton />
              </div>
            ) : (
              <Link 
                href="/login" 
                className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 