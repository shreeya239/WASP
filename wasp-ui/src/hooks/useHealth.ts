import { useQuery } from './useQuery'
import { getHealth } from '../api/client'

export function useHealth() {
  return useQuery('health', () => getHealth(), { refetchInterval: 30000 })
}
