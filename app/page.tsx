import { WalletConnect } from '../components/WalletConnect';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8">
        {/* Page title */}
        <h1 className="text-4xl font-bold text-black dark:text-white">
          Sui Wallet
        </h1>
        
        {/* Wallet connection component */}
        <WalletConnect />
      </main>
    </div>
  );
}
