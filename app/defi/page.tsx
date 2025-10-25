'use client';

import { useState, useEffect } from 'react';
import { 
  useCurrentAccount, 
  useSignAndExecuteTransaction,
  useSuiClient 
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { ConnectButton } from '@mysten/dapp-kit';
import Link from 'next/link';

// Your deployed DeFi contract details
const PACKAGE_ID: string = '0xff458614c6a15f53e710e9a93ff2437a8d4afd724f527a9740233dad77759ed5';
const POOL_ID: string = '0x8257dacc05b5c72cfe5725c73840dfe984fb826f4b1327cc10a1262e32611af6';

export default function DeFiPage() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [txDigest, setTxDigest] = useState<string>('');
  const [poolBalance, setPoolBalance] = useState<string>('0');
  const [userDebt, setUserDebt] = useState<string>('0');
  const [userBalance, setUserBalance] = useState<string>('0');

  // Fetch pool balance and user debt
  const fetchPoolData = async () => {
    if (!currentAccount) return;

    try {
      // Get pool balance
      const poolObject = await suiClient.getObject({
        id: POOL_ID,
        options: { showContent: true },
      });

      if (poolObject.data?.content?.dataType === 'moveObject') {
        const fields = poolObject.data.content.fields as any;
        const balance = fields.deposits || '0';
        setPoolBalance((Number(balance) / 1_000_000_000).toFixed(4));
      }

      // Get user's SUI balance
      const coins = await suiClient.getBalance({
        owner: currentAccount.address,
        coinType: '0x2::sui::SUI',
      });
      setUserBalance((Number(coins.totalBalance) / 1_000_000_000).toFixed(4));

      // Note: Getting user debt requires calling a view function
      // For simplicity, we'll show it after transactions
      
    } catch (error) {
      console.error('Error fetching pool data:', error);
    }
  };

  useEffect(() => {
    if (currentAccount) {
      fetchPoolData();
    }
  }, [currentAccount]);

  // Function to deposit SUI
  const handleDeposit = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!depositAmount || Number(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const tx = new Transaction();
      
      // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
      const amountInMist = Math.floor(Number(depositAmount) * 1_000_000_000);
      
      const [coin] = tx.splitCoins(tx.gas, [amountInMist]);

      tx.moveCall({
        target: `${PACKAGE_ID}::defi::deposit`,
        arguments: [
          tx.object(POOL_ID),
          coin,
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log('Deposit successful:', result);
            setTxDigest(result.digest);
            alert(`Deposit successful! Tx: ${result.digest}`);
            setDepositAmount('');
            await fetchPoolData();
          },
          onError: (error) => {
            console.error('Deposit failed:', error);
            alert('Deposit failed: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Error depositing:', error);
      alert('Failed to deposit');
    } finally {
      setLoading(false);
    }
  };

  // Function to borrow SUI
  const handleBorrow = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!borrowAmount || Number(borrowAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const tx = new Transaction();
      
      const amountInMist = Math.floor(Number(borrowAmount) * 1_000_000_000);

      tx.moveCall({
        target: `${PACKAGE_ID}::defi::borrow`,
        arguments: [
          tx.object(POOL_ID),
          tx.pure.u64(amountInMist),
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log('Borrow successful:', result);
            setTxDigest(result.digest);
            alert(`Borrow successful! Tx: ${result.digest}`);
            setBorrowAmount('');
            await fetchPoolData();
          },
          onError: (error) => {
            console.error('Borrow failed:', error);
            alert('Borrow failed: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Error borrowing:', error);
      alert('Failed to borrow');
    } finally {
      setLoading(false);
    }
  };

  // Function to repay SUI
  const handleRepay = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!repayAmount || Number(repayAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const tx = new Transaction();
      
      const amountInMist = Math.floor(Number(repayAmount) * 1_000_000_000);
      
      const [coin] = tx.splitCoins(tx.gas, [amountInMist]);

      tx.moveCall({
        target: `${PACKAGE_ID}::defi::repay`,
        arguments: [
          tx.object(POOL_ID),
          coin,
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log('Repay successful:', result);
            setTxDigest(result.digest);
            alert(`Repay successful! Tx: ${result.digest}`);
            setRepayAmount('');
            await fetchPoolData();
          },
          onError: (error) => {
            console.error('Repay failed:', error);
            alert('Repay failed: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Error repaying:', error);
      alert('Failed to repay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                ← Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                DeFi Platform
              </h1>
            </div>
            <ConnectButton />
          </div>
          
          {currentAccount && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Connected Address:</span>{' '}
                <span className="font-mono text-xs break-all">
                  {currentAccount.address}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Contract Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Contract Information
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex flex-col">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Package ID:</span>
              <span className="font-mono text-xs break-all text-gray-800 dark:text-gray-200">
                {PACKAGE_ID}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Pool ID:</span>
              <span className="font-mono text-xs break-all text-gray-800 dark:text-gray-200">
                {POOL_ID}
              </span>
            </div>
            {(PACKAGE_ID === '0xYOUR_PACKAGE_ID_HERE' || POOL_ID === '0xYOUR_POOL_ID_HERE') && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mt-2">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Please update PACKAGE_ID and POOL_ID with your deployed contract details.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Pool Balance
            </h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {poolBalance} SUI
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Your Balance
            </h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {userBalance} SUI
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Your Debt
            </h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {userDebt} SUI
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Deposit */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              💰 Deposit
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (SUI)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleDeposit}
                disabled={loading || !currentAccount || !depositAmount}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Processing...' : 'Deposit'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Deposit SUI into the pool to provide liquidity
              </p>
            </div>
          </div>

          {/* Borrow */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              📤 Borrow
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (SUI)
                </label>
                <input
                  type="number"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleBorrow}
                disabled={loading || !currentAccount || !borrowAmount}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Processing...' : 'Borrow'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Borrow SUI from the pool (requires sufficient liquidity)
              </p>
            </div>
          </div>

          {/* Repay */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              📥 Repay
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (SUI)
                </label>
                <input
                  type="number"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleRepay}
                disabled={loading || !currentAccount || !repayAmount}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Processing...' : 'Repay'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Repay your borrowed SUI
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Result */}
        {txDigest && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Last Transaction
            </h2>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Transaction Digest:
              </p>
              <p className="font-mono text-xs break-all text-gray-800 dark:text-gray-200 mb-3">
                {txDigest}
              </p>
              <a
                href={`https://testnet.suivision.xyz/txblock/${txDigest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded transition-colors duration-200"
              >
                View on Explorer →
              </a>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            How to Use
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Deploy your DeFi contract and update PACKAGE_ID and POOL_ID above</li>
            <li>Connect your wallet</li>
            <li><strong>Deposit:</strong> Add SUI to the pool to provide liquidity</li>
            <li><strong>Borrow:</strong> Take out a loan (tracked as debt)</li>
            <li><strong>Repay:</strong> Pay back your borrowed amount</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Note:</strong> This is a simple DeFi contract with no collateral requirements. 
              You can borrow as long as the pool has sufficient SUI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

