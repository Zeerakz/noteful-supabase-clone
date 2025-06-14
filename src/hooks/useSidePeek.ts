
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

export function useSidePeek() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const peekId = useMemo(() => searchParams.get('peek'), [searchParams]);
  const isPeeking = !!peekId;

  const closePeek = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('peek');
    navigate({ search: newParams.toString() }, { replace: true });
  }, [searchParams, navigate]);

  return { peekId, isPeeking, closePeek };
}
