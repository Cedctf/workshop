'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';

interface UserNFTListProps {
  nfts: any[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export default function UserNFTList({ nfts, loading, onRefresh }: UserNFTListProps) {
  const currentAccount = useCurrentAccount();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Your NFTs
        </h2>
        <button
          onClick={onRefresh}
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
      ) : nfts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No NFTs found. Mint your first NFT!
        </p>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {nfts.map((nft, index) => {
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
  );
}

