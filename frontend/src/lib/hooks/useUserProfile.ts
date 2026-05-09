import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api/auth'
import { apiClient } from '@/lib/api/client'
import type { UpdateProfileRequest, User } from '@/types'

const KEY = ['auth', 'me']

/** Generic 'who am I' profile, sourced from /auth/me. Works for any role. */
export function useUserProfile() {
  return useQuery<User>({
    queryKey: KEY,
    queryFn: () => authApi.getCurrentUser(),
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => authApi.updateProfile(data),
    onSuccess: (user) => {
      queryClient.setQueryData(KEY, user)
    },
  })
}

export function useUploadUserProfileImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await apiClient.post<{ imageUrl: string }>(
        '/auth/profile-image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}
