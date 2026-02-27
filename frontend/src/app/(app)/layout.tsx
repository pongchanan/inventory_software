import { AppShell } from "../../components/layout/shell/AppShell";

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AppShell>{children}</AppShell>;
}
