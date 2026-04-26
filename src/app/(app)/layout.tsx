import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { MobileTopBar } from "@/components/mobile-top-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <>
      <AppHeader userEmail={session.user.email} />
      <MobileTopBar />
      <main className="flex-1 flex flex-col pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
