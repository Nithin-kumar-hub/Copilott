/*
 * Catalog categories for the static game catalog.
 * This module centralizes the read-only queries used to list categories.
 */

import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';

/**
 * Fetch all categories in alphabetical order for the filter controls and listing UI.
 *
 * @param db - Injected database connection used to query the categories table.
 * @returns Every category record with the public fields needed by the UI.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    const rows = await db
        .select({
            id: categories.id,
            name: categories.name,
        })
        .from(categories)
        .orderBy(asc(categories.name));

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
    }));
}
