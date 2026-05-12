import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useNews = () => {
  return useQuery({
    queryKey: ['news', 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
};