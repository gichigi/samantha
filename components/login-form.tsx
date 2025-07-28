"use client"

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/utils/supabase/client'

export function LoginForm() {
  const supabase = createClient()

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Sign in to Samantha</h2>
          <p className="text-gray-600 mt-2">
            Sign in to extract and read articles with AI assistance.
          </p>
          <p className="text-sm text-blue-600 font-medium mt-1">
            Free: 3 articles per day
          </p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#3b82f6',
                  brandAccent: '#2563eb',
                  brandButtonText: 'white',
                  defaultButtonBackground: 'white',
                  defaultButtonBackgroundHover: '#f8fafc',
                  defaultButtonBorder: '#e2e8f0',
                  defaultButtonText: '#374151',
                  dividerBackground: '#e2e8f0',
                  inputBackground: 'white',
                  inputBorder: '#d1d5db',
                  inputBorderHover: '#9ca3af',
                  inputBorderFocus: '#3b82f6',
                  inputText: '#111827',
                  inputLabelText: '#374151',
                  inputPlaceholder: '#9ca3af',
                  messageText: '#dc2626',
                  messageTextDanger: '#dc2626',
                  anchorTextColor: '#3b82f6',
                  anchorTextHoverColor: '#2563eb',
                },
                space: {
                  buttonPadding: '10px 15px',
                  inputPadding: '10px 15px',
                },
                borderWidths: {
                  buttonBorderWidth: '1px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '6px',
                  buttonBorderRadius: '6px',
                  inputBorderRadius: '6px',
                }
              }
            },
            style: {
              button: {
                fontFamily: 'inherit',
                fontWeight: '500',
              },
              input: {
                fontFamily: 'inherit',
              },
              label: {
                fontFamily: 'inherit',
                fontWeight: '500',
              }
            }
          }}
          providers={['google']}
          redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
          onlyThirdPartyProviders
          localization={{
            variables: {
              sign_in: {
                social_provider_text: 'Continue with {{provider}}',
              },
            },
          }}
        />
        
        <div className="text-center text-xs text-gray-500 mt-4">
          By signing in, you agree to our terms of service and privacy policy.
        </div>
      </div>
    </div>
  )
} 