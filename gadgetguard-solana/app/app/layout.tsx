import type { Metadata } from "next";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import Navigation from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
    title: "GadgetGuard Solana - Decentralized Protection Pool",
    description: "Freelancer protection pool on Solana",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <WalletContextProvider>
                    <Navigation />
                    <main>{children}</main>
                </WalletContextProvider>
            </body>
        </html>
    );
}
