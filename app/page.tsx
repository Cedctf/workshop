import { WalletConnect } from './components/WalletConnect';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8">
        {/* Page title */}
        <h1 className="text-4xl font-bold text-black dark:text-white">
          Sui NFT Wallet
        </h1>
        
        {/* Wallet connection component */}
        <WalletConnect />
        
        {/* Link to test page */}
        <Link 
          href="/test"
          className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
        >
          Test Greeting Contract →
        </Link>
      </main>
    </div>
  );
}
