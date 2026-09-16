/*
 * Data-access helpers for the static game catalog.
 * These queries power the homepage, detail pages, and filter options.
 */

import { eq, asc, and } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

export interface GameFilters {
    categoryId?: number | null;
    publisherId?: number | null;
}

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

function applyGameFilters(query: ReturnType<typeof baseGamesQuery>, filters: GameFilters = {}) {
    const clauses = [];

    if (filters.categoryId !== undefined && filters.categoryId !== null) {
        clauses.push(eq(games.categoryId, filters.categoryId));
    }

    if (filters.publisherId !== undefined && filters.publisherId !== null) {
        clauses.push(eq(games.publisherId, filters.publisherId));
    }

    return clauses.length > 0 ? query.where(and(...clauses)) : query;
}

/**
 * Fetch every game, optionally narrowed to the provided category and publisher filters.
 *
 * @param db - Injected database connection used to query the games table.
 * @param filters - Optional filters to apply before ordering the catalog.
 * @returns A list of game records ordered alphabetically by title.
 */
export async function getAllGames(db: Database, filters: GameFilters = {}): Promise<Game[]> {
    const rows = await applyGameFilters(baseGamesQuery(db), filters).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/**
 * Fetch a filtered set of games for the current category and/or publisher selection.
 *
 * @param db - Injected database connection used to query the games table.
 * @param filters - Optional category and publisher predicates.
 * @returns Matching game rows ordered alphabetically by title.
 */
export async function getFilteredGames(db: Database, filters: GameFilters = {}): Promise<Game[]> {
    return getAllGames(db, filters);
}

/**
 * Fetch all games belonging to a specific category.
 *
 * @param db - Injected database connection used to query the games table.
 * @param categoryId - Category identifier to match.
 * @returns Matching game records ordered alphabetically by title.
 */
export async function getGamesByCategoryId(db: Database, categoryId: number): Promise<Game[]> {
    return getAllGames(db, { categoryId });
}

/**
 * Fetch all games belonging to a specific publisher.
 *
 * @param db - Injected database connection used to query the games table.
 * @param publisherId - Publisher identifier to match.
 * @returns Matching game records ordered alphabetically by title.
 */
export async function getGamesByPublisherId(db: Database, publisherId: number): Promise<Game[]> {
    return getAllGames(db, { publisherId });
}

/** All game ids ordered by title. */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/** A single game by id, or null when it does not exist. */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}
