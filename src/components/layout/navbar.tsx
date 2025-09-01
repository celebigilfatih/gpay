"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            GPay
          </Link>
          {session && (
            <div className="hidden md:flex gap-4">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/clients">Clients</Link>
              <Link href="/brokers">Brokers</Link>
              <Link href="/transactions">Transactions</Link>
              <Link href="/stocks">Stocks</Link>
            </div>
          )}
        </div>
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <span>Welcome, {session.user?.name}</span>
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}