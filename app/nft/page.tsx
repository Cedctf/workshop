'use client';

import { useState } from 'react';
import { 
  useCurrentAccount, 
  useSignAndExecuteTransaction,
  useSuiClient 
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { ConnectButton } from '@mysten/dapp-kit';
import Link from 'next/link';

// Your deployed NFT contract details
const PACKAGE_ID = '0x430f25df7e6d52c4f68798248ede62adfd16b73bea4496224a666c4be1ee4aa1';

export default function NFTPage() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [txDigest, setTxDigest] = useState<string>('');
  const [mintedNFTs, setMintedNFTs] = useState<any[]>([]);

  // Helper function to manually encode string to BCS format (bypass SDK bug)
  const encodeToBCS = (text: string): Uint8Array => {
    const textEncoder = new TextEncoder();
    const stringBytes = textEncoder.encode(text);
    const length = stringBytes.length;
    
    // Manually encode ULEB128 length prefix
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
    
    return new Uint8Array([...lengthBytes, ...stringBytes]);
  };

  // Function to mint NFT
  const mintNFT = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!name.trim() || !description.trim() || !imageUrl.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      console.log('=== Mint NFT Debug ===');
      console.log('Name:', name);
      console.log('Description:', description);
      console.log('Image URL:', imageUrl);
      
      const tx = new Transaction();

      // Encode strings to BCS format
      const nameBytes = encodeToBCS(name);
      const descBytes = encodeToBCS(description);
      const urlBytes = encodeToBCS(imageUrl);

      console.log('Name BCS bytes:', nameBytes);
      console.log('Description BCS bytes:', descBytes);
      console.log('URL BCS bytes:', urlBytes);

      tx.moveCall({
        target: `${PACKAGE_ID}::nft::mint_to_sender`,
        arguments: [
          tx.pure(nameBytes),
          tx.pure(descBytes),
          tx.pure(urlBytes),
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
            alert(`NFT Minted! Tx Digest: ${result.digest}`);
            
            // Clear form
            setName('');
            setDescription('');
            setImageUrl('');
            
            // Fetch user's NFTs
            await fetchUserNFTs();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('Transaction failed: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Failed to mint NFT');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch user's NFTs
  const fetchUserNFTs = async () => {
    if (!currentAccount) return;

    try {
      setLoading(true);
      const objects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${PACKAGE_ID}::nft::NFT`,
        },
        options: {
          showContent: true,
          showDisplay: true,
        },
      });

      console.log('Owned NFTs:', objects);
      setMintedNFTs(objects.data);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-8">
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
                NFT Minting Platform
              </h1>
            </div>
            <ConnectButton />
          </div>
          
          {currentAccount && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-gray-700 rounded-lg">
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
            {PACKAGE_ID === '0xYOUR_PACKAGE_ID_HERE' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mt-2">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Please update the PACKAGE_ID in the code with your deployed NFT contract package ID.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Mint NFT Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Mint New NFT
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NFT Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Cool Dragon #1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your NFT..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {imageUrl && (
                <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="NFT Preview" 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              )}
              
              <button
                onClick={mintNFT}
                disabled={loading || !currentAccount || !name.trim() || !description.trim() || !imageUrl.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Minting...' : '🎨 Mint NFT'}
              </button>
              
              {!currentAccount && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Please connect your wallet first
                </p>
              )}
            </div>
          </div>

          {/* Your NFTs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Your NFTs
              </h2>
              <button
                onClick={fetchUserNFTs}
                disabled={loading || !currentAccount}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>

            {!currentAccount ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Connect your wallet to view your NFTs
              </p>
            ) : mintedNFTs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No NFTs found. Mint your first NFT!
              </p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {mintedNFTs.map((nft, index) => {
                  const content = nft.data?.content;
                  const fields = content?.dataType === 'moveObject' ? content.fields : null;
                  
                  return (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      {fields?.url && (
                        <img 
                          src={fields.url} 
                          alt={fields.name || 'NFT'} 
                          className="w-full h-32 object-cover rounded mb-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=NFT';
                          }}
                        />
                      )}
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {fields?.name || 'Unnamed NFT'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {fields?.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono break-all">
                        ID: {nft.data?.objectId}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
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
      </div>
    </div>
  );
}


