export interface Item {
    id: number;
    name: string;
    qty: number;
    total: number;
    cabinet: string;
    img: string;
}

export interface BorrowedItem {
    id: number;
    name: string;
    date: string;
    loc: string;
    img: string;
    status?: 'active' | 'overdue' | 'returning';
}

export interface User {
    id: string;
    name: string;
    studentId: string;
    initial: string;
}
