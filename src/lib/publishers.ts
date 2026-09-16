/*
 * Publisher lookups for the static game catalog.
 * This module centralizes the read-only query used to list publishers.
 */

import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';

/**
 * Fetch all publishers in alphabetical order for the catalog and detail pages.
 *
 * @param db - Injected database connection used to query the publishers table.
 * @returns Every publisher record with the public fields needed by the UI.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    const rows = await db
        .select({
            id: publishers.id,
            name: publishers.name,
        })
        .from(publishers)
        .orderBy(asc(publishers.name));

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
    }));
}
