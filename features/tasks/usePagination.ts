import { useState } from 'react';

interface UsePaginationProps {
    initialPage?: number;
    initialLimit?: number;
}

export function usePagination({ initialPage = 1, initialLimit = 20 }: UsePaginationProps = {}) {
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);
    const [total, setTotal] = useState(0);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const nextPage = () => {
        if (hasNextPage) {
            setPage((p) => p + 1);
        }
    };

    const prevPage = () => {
        if (hasPrevPage) {
            setPage((p) => p - 1);
        }
    };

    const goToPage = (p: number) => {
        const target = Math.max(1, Math.min(p, totalPages));
        setPage(target);
    };

    return {
        page,
        limit,
        total,
        setTotal,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
        goToPage,
        setLimit,
    };
}
