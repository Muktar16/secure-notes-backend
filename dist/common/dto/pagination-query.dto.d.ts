export declare class PaginationQueryDto {
    page: number;
    limit: number;
}
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare function paginate<T>(query: Promise<T[]>, countQuery: Promise<number>, page: number, limit: number): Promise<PaginatedResult<T>>;
