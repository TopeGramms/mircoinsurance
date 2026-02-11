"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletButton from "./WalletButton";

export default function Navigation() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", label: "Overview" },
        { href: "/pool", label: "My Coverage" },
        { href: "/actions", label: "Deposit/Withdraw" },
        { href: "/claims", label: "Claims Feed" },
        { href: "/submit-claim", label: "Submit Claim" },
    ];

    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className="nav-brand">
                    <h1>GadgetGuard</h1>
                    <span className="network-badge">Devnet</span>
                </div>

                <div className="nav-links">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-link ${pathname === item.href ? "active" : ""}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <WalletButton />
            </div>
        </nav>
    );
}
