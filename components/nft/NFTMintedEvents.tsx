'use client';

interface NFTMintedEvent {
  objectId: string;
  creator: string;
  name: string;
  timestamp: string;
  txDigest: string;
  eventSeq?: number;
}

interface NFTMintedEventsProps {
  events: NFTMintedEvent[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export default function NFTMintedEvents({ events, loading, onRefresh }: NFTMintedEventsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          📋 All NFT Minted Events ({events.length})
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Loading...' : '🔄 Refresh Events'}
        </button>
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No NFT minted events found. Mint an NFT to see events here!
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.map((event, index) => (
            <div key={index} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    NFT Name:
                  </span>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {event.name}
                  </p>
                </div>
                
                <div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Object ID:
                  </span>
                  <p className="text-xs font-mono break-all text-gray-700 dark:text-gray-300">
                    {event.objectId}
                  </p>
                </div>
                
                <div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Creator:
                  </span>
                  <p className="text-xs font-mono break-all text-gray-700 dark:text-gray-300">
                    {event.creator}
                  </p>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-purple-200 dark:border-purple-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                  <a
                    href={`https://testnet.suivision.xyz/txblock/${event.txDigest}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                  >
                    View Tx →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

