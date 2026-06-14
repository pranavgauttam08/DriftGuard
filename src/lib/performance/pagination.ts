// ============================================================
// Cursor-Based Pagination — All list endpoints
// ============================================================

export interface PaginationParams {
  cursor?: string;       // opaque cursor token
  limit?: number;        // page size (default: 25, max: 100)
  direction?: 'forward' | 'backward';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
    total?: number;
    limit: number;
  };
}

/**
 * Encode a cursor from a timestamp + id pair.
 */
export function encodeCursor(timestamp: string | Date, id: string): string {
  const ts = typeof timestamp === 'string' ? timestamp : timestamp.toISOString();
  return Buffer.from(`${ts}|${id}`).toString('base64url');
}

/**
 * Decode a cursor into a timestamp + id pair.
 */
export function decodeCursor(cursor: string): { timestamp: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    const [timestamp, id] = decoded.split('|');
    if (!timestamp || !id) return null;
    return { timestamp, id };
  } catch {
    return null;
  }
}

/**
 * Parse pagination params from request search params.
 */
export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const cursor = searchParams.get('cursor') || undefined;
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25') || 25));
  const direction = (searchParams.get('direction') || 'forward') as 'forward' | 'backward';
  return { cursor, limit, direction };
}

/**
 * Build paginated response.
 */
export function buildPaginatedResponse<T extends { id: string; createdAt?: Date | string }>(
  data: T[],
  params: PaginationParams,
  total?: number
): PaginatedResponse<T> {
  const limit = params.limit || 25;
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  let nextCursor: string | undefined;
  let prevCursor: string | undefined;

  if (hasMore && items.length > 0) {
    const last = items[items.length - 1];
    const ts = last.createdAt instanceof Date ? last.createdAt.toISOString() : (last.createdAt || new Date().toISOString());
    nextCursor = encodeCursor(ts, last.id);
  }

  if (params.cursor && items.length > 0) {
    const first = items[0];
    const ts = first.createdAt instanceof Date ? first.createdAt.toISOString() : (first.createdAt || new Date().toISOString());
    prevCursor = encodeCursor(ts, first.id);
  }

  return {
    data: items,
    pagination: {
      hasMore,
      nextCursor,
      prevCursor,
      total,
      limit,
    },
  };
}

/**
 * Apply cursor to Supabase query.
 */
export function applyCursorToQuery(
  query: any,
  cursor: string | undefined,
  direction: 'forward' | 'backward' = 'forward',
  timestampColumn: string = 'created_at',
  idColumn: string = 'id'
): any {
  if (!cursor) return query;

  const decoded = decodeCursor(cursor);
  if (!decoded) return query;

  if (direction === 'forward') {
    return query
      .or(`${timestampColumn}.lt.${decoded.timestamp},and(${timestampColumn}.eq.${decoded.timestamp},${idColumn}.lt.${decoded.id})`);
  } else {
    return query
      .or(`${timestampColumn}.gt.${decoded.timestamp},and(${timestampColumn}.eq.${decoded.timestamp},${idColumn}.gt.${decoded.id})`);
  }
}
