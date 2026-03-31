"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/layout/shell/AppShell";
import { useAuth } from "../../context/AuthContext";

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        // If auth check is done (loading is false) and no user is logged in, redirect to login
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Show nothing while loading to prevent flashing content
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // If user is not authenticated, don't render the app shell
    if (!user) {
        return null;
    }

    return <AppShell>{children}</AppShell>;
}
