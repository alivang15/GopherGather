"use client"
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export function useUserType() {
  const { user, loading } = useAuth()
  const [userType, setUserType] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !user) return
    supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) setUserType(null)
        else setUserType(data?.user_type ?? null)
      })
  }, [user, loading])

  return userType
}
