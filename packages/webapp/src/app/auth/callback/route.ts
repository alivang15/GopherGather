import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error_code = requestUrl.searchParams.get('error_code');
  const error_description = requestUrl.searchParams.get('error_description');

  console.log('🔄 Auth callback route handler:', { code: !!code, error_code });

  if (error_code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(error_description || 'Authentication failed')}`
    );
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('❌ Error exchanging code for session:', error);
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`
        );
      }

      return NextResponse.redirect(
        `${requestUrl.origin}/auth/sign-in?message=${encodeURIComponent('Email confirmed! You can now sign in.')}`
      );
    } catch (err: unknown) {
      // Log safely and return a generic redirect message
      console.error('❌ Unexpected error in auth callback:', err);
      try {
        const details = err instanceof Error ? err.message : JSON.stringify(err);
        console.error('❌ Unexpected error details:', details);
      } catch {
        // ignore JSON errors
      }
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent('Account confirmation failed')}`
      );
    }
  }

  // No code parameter
  return NextResponse.redirect(
    `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent('Invalid confirmation link')}`
  );
}
