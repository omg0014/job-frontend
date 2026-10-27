import { useQuery } from '@tanstack/react-query';
import { request } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';

/**
 * The seeded vocabulary that backs every chip autocomplete. Served from the
 * same source the CV parser matches against, and effectively static — so it is
 * cached hard.
 */
export const useTaxonomy = () =>
  useQuery({
    queryKey: ['taxonomy'],
    queryFn: () => request(endpoints.meta.taxonomy),
    staleTime: Infinity,
    gcTime: Infinity,
  });
