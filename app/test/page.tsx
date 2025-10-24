'use client';

import { useState } from 'react';
import { 
  useCurrentAccount, 
  useSignAndExecuteTransaction,
  useSuiClient 
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { ConnectButton } from '@mysten/dapp-kit';
import { bcs } from '@mysten/sui/bcs';

// Your deployed smart contract details
const PACKAGE_ID = '0x90360482007f07a3e43cee6975ec1f23b8e9676c9b2fc9752c132b91888db018';
const GREETING_OBJECT_ID = '0x1efdab5881e176130813d2fdf36fd5206d9f5c01e72a01118ff232d51a7dd50b';

export default function TestPage() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [greetingText, setGreetingText] = useState<string>('');
  const [newText, setNewText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [txDigest, setTxDigest] = useState<string>('');

  // Function to fetch current greeting text
  const fetchGreeting = async () => {
    try {
      setLoading(true);
      const object = await suiClient.getObject({
        id: GREETING_OBJECT_ID,
        options: {
          showContent: true,
        },
      });

      if (object.data && object.data.content && object.data.content.dataType === 'moveObject') {
        const fields = object.data.content.fields as any;
        setGreetingText(fields.text || 'No text found');
      }
    } catch (error) {
      console.error('Error fetching greeting:', error);
      alert('Failed to fetch greeting');
    } finally {
      setLoading(false);
    }
  };

  // Function to create a new greeting
  const createNewGreeting = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::greeting::new`,
        arguments: [],
      });

      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('Transaction successful:', result);
            setTxDigest(result.digest);
            alert(`New greeting created! Tx Digest: ${result.digest}`);
            await fetchGreeting();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('Transaction failed: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Error creating greeting:', error);
      alert('Failed to create greeting');
    } finally {
      setLoading(false);
    }
  };

  // Function to update greeting text
  const updateGreetingText = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!newText.trim()) {
      alert('Please enter new text');
      return;
    }

    try {
      setLoading(true);
      console.log('=== Update Greeting Debug ===');
      console.log('newText value:', newText);
      console.log('newText type:', typeof newText);
      console.log('newText length:', newText.length);
      console.log('newText trimmed:', newText.trim());
      
      const tx = new Transaction();

      console.log('Creating moveCall with target:', `${PACKAGE_ID}::greeting::update_text`);
      console.log('Object ID:', GREETING_OBJECT_ID);
      
      // Manually encode string with proper BCS format (bypassing buggy ULEB encoder)
      console.log('Manually encoding string to BCS format...');
      
      // Convert string to UTF-8 bytes
      const textEncoder = new TextEncoder();
      const stringBytes = textEncoder.encode(newText);
      const length = stringBytes.length;
      
      console.log('String bytes:', stringBytes);
      console.log('String length:', length);
      
      // Manually encode ULEB128 length prefix (for small strings < 128 bytes, it's just the length)
      let lengthBytes: number[];
      if (length < 128) {
        lengthBytes = [length];
      } else if (length < 16384) {
        lengthBytes = [(length & 0x7f) | 0x80, (length >> 7) & 0x7f];
      } else {
        lengthBytes = [
          (length & 0x7f) | 0x80,
          ((length >> 7) & 0x7f) | 0x80,
          (length >> 14) & 0x7f
        ];
      }
      
      console.log('Length bytes (ULEB128):', lengthBytes);
      
      // Combine length prefix + string bytes
      const bcsBytes = new Uint8Array([...lengthBytes, ...stringBytes]);
      console.log('Final BCS bytes:', bcsBytes);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::greeting::update_text`,
        arguments: [
          tx.object(GREETING_OBJECT_ID),
          tx.pure(bcsBytes),
        ],
      });
      
      console.log('Transaction created successfully');

      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('Transaction successful:', result);
            setTxDigest(result.digest);
            alert(`Greeting updated! Tx Digest: ${result.digest}`);
            setNewText('');
            await fetchGreeting();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('Transaction failed: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Error updating greeting:', error);
      alert('Failed to update greeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Greeting Smart Contract Test
            </h1>
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
              <span className="font-semibold text-gray-600 dark:text-gray-400">Greeting Object ID:</span>
              <span className="font-mono text-xs break-all text-gray-800 dark:text-gray-200">
                {GREETING_OBJECT_ID}
              </span>
            </div>
          </div>
        </div>

        {/* Current Greeting Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Current Greeting
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            {greetingText ? (
              <p className="text-lg text-gray-800 dark:text-white font-medium">
                "{greetingText}"
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                No greeting loaded. Click "Fetch Greeting" to load.
              </p>
            )}
          </div>

          <button
            onClick={fetchGreeting}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Loading...' : 'Fetch Greeting'}
          </button>
        </div>

        {/* Create New Greeting */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Create New Greeting
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Creates a new shared Greeting object with text "Hello world!"
          </p>
          
          <button
            onClick={createNewGreeting}
            disabled={loading || !currentAccount}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Processing...' : 'Create New Greeting'}
          </button>
          
          {!currentAccount && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              Please connect your wallet first
            </p>
          )}
        </div>

        {/* Update Greeting */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Update Greeting Text
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Text
              </label>
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter new greeting text..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <button
              onClick={updateGreetingText}
              disabled={loading || !currentAccount || !newText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Processing...' : 'Update Greeting'}
            </button>
            
            {!currentAccount && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Please connect your wallet first
              </p>
            )}
          </div>
        </div>

        {/* Transaction Result */}
        {txDigest && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
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
      </div>
    </div>
  );
}
