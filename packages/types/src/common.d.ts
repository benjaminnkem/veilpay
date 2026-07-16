export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}
export interface PaginationQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface ApiMessage {
    message: string;
}
export interface Timestamps {
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=common.d.ts.map