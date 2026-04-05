import { AppShell } from "../../components/layout/shell/AppShell";
import { ProtectedRouteGuard } from "../../components/auth/ProtectedRouteGuard";

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ProtectedRouteGuard>
            <AppShell>{children}</AppShell>
        </ProtectedRouteGuard>
    );
}
