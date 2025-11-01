import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import type { EventId, SuiEvent } from "@mysten/sui/client";
import { LISTING_STRUCT_TYPE, CONTRACT_MARKETPLACE_ID, CONTRACT_PACKAGE_ID, CONTRACT_MODULE_NAME, BUY_NFT_METHOD, CANCEL_LISTING_METHOD } from "./constants/smart-contract";
import { Flex, Heading, Text, Button, Spinner, Card } from "@radix-ui/themes";
import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 8;

export default function Marketplace() {
  const [cursor, setCursor] = useState<EventId | null>(null);
  const [pollKey, setPollKey] = useState(0);
  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const client = useSuiClient();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["listings", cursor, pollKey],
    queryFn: async () => {
      const events = await client.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_PACKAGE_ID}::${CONTRACT_MODULE_NAME}::ListNFTEvent`,
        },
        cursor: cursor ?? undefined,
        limit: PAGE_SIZE,
        order: "descending",
      });
      
      console.log("🔍 Events found:", events.data?.length || 0);
      
      const listingIds: string[] = (events.data || [])
        .map((e: SuiEvent) => {
          const parsedEvent = e.parsedJson as { listing_id?: string } | undefined;
          console.log("📄 Event parsedJson:", parsedEvent);
          return parsedEvent?.listing_id;
        })
        .filter((id): id is string => id !== undefined && id !== null && id !== '');

      console.log("🎯 Listing IDs found:", listingIds);
      
      if (listingIds.length === 0) {
        console.log("❌ No listing IDs found - returning empty data");
        return { data: [], nextCursor: events.nextCursor ?? null };
      }
      
      const objects = await client.multiGetObjects({
        ids: listingIds,
        options: { showContent: true },
      });

      console.log("📦 Objects fetched:", objects);
      
      // DEBUG: Check what types we actually have
      objects.forEach((obj: any, index: number) => {
        console.log(`Object ${index} type:`, obj.data?.content?.type);
        console.log(`Object ${index} content:`, obj.data?.content);
      });

      const alive = objects.filter(
        (o: any) => {
          const isAlive = o.data?.content?.type === LISTING_STRUCT_TYPE;
          console.log(`Object ${o.data?.objectId} is alive:`, isAlive, "Expected type:", LISTING_STRUCT_TYPE);
          return isAlive;
        }
      );

      console.log("✅ Alive listings:", alive.length);
      return { data: alive, nextCursor: events.nextCursor ?? null };
    },
    refetchInterval: 6000,
  });

  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  async function handleBuy(listingObjId: string, price: number) {
    setPendingTx(listingObjId);
    setAlert(null);
    
    const txb = new Transaction();
    txb.moveCall({
      target: `${CONTRACT_PACKAGE_ID}::${CONTRACT_MODULE_NAME}::${BUY_NFT_METHOD}`,
      arguments: [
        txb.object(listingObjId),
        txb.splitCoins(txb.gas, [txb.pure.u64(price)]),
        txb.object(CONTRACT_MARKETPLACE_ID),
      ],
    });
    
    signAndExecute(
      { transaction: txb },
      {
        onSuccess: () => {
          setAlert({ type: "success", message: "🎉 NFT purchased successfully!" });
          refetch();
          setPendingTx(null);
        },
        onError: (e) => {
          setAlert({ type: "error", message: e.message ?? "❌ Purchase failed" });
          setPendingTx(null);
        },
      },
    );
  }

  function handleCancel(listingObjId: string) {
    setPendingTx(listingObjId);
    setAlert(null);
    
    const txb = new Transaction();
    txb.moveCall({
      target: `${CONTRACT_PACKAGE_ID}::${CONTRACT_MODULE_NAME}::${CANCEL_LISTING_METHOD}`,
      arguments: [txb.object(listingObjId)],
    });
    
    signAndExecute(
      { transaction: txb },
      {
        onSuccess: () => {
          setAlert({ type: "success", message: "✅ Listing cancelled successfully" });
          refetch();
          setPendingTx(null);
        },
        onError: (e) => {
          setAlert({ type: "error", message: e.message ?? "❌ Cancel failed" });
          setPendingTx(null);
        },
      },
    );
  }

  return (
    <div className="content-wrapper">
      <Flex direction="column" gap="6">
        {/* Header Section */}
        <Card className="glass-card">
          <Flex direction="column" gap="3">
            <Flex align="center" gap="3">
              <Heading size="7" weight="bold">🛍️ NFT Marketplace</Heading>
              <div className="nft-price" style={{ fontSize: '0.9rem', padding: '0.25rem 0.75rem' }}>
                Live
              </div>
            </Flex>
            <Text size="4" color="gray">
              Discover and trade unique digital assets on the Sui blockchain
            </Text>
          </Flex>
        </Card>

        {/* Alert Messages */}
        {alert && (
          <Card className={alert.type === "success" ? "success-message" : "error-message"}>
            <Text weight="medium">{alert.message}</Text>
          </Card>
        )}

        {/* Listings Grid */}
        {isPending ? (
          <Card className="glass-card">
            <Flex align="center" justify="center" py="8" gap="3">
              <Spinner size="3" />
              <Text size="4">Loading marketplace...</Text>
            </Flex>
          </Card>
        ) : error ? (
          <Card className="error-message">
            <Text>Error loading marketplace: {(error as any)?.message}</Text>
          </Card>
        ) : data && data.data.length === 0 ? (
          <Card className="glass-card">
            <Flex direction="column" align="center" py="8" gap="4">
              <Text size="6">🏷️</Text>
              <Heading size="5" align="center">No Listings Available</Heading>
              <Text align="center" color="gray" size="4">
                Be the first to list an NFT for sale in the marketplace
              </Text>
            </Flex>
          </Card>
        ) : (
          <>
            <div className="nft-grid">
              {data?.data?.map((object: any) => {
                const listing = object.data?.content?.fields;
                if (!listing) return null;
                
                const canBuy = !!account && account.address !== listing.seller;
                const canCancel = !!account && account.address === listing.seller;
                const priceInSui = Number(listing.price) / 1_000_000_000;
                const isPendingThis = pendingTx === object.data.objectId;

                return (
                  <div key={object.data.objectId} className="nft-card">
                    {listing.nft?.fields?.url && (
                      <img
                        src={listing.nft.fields.url}
                        alt="NFT"
                        className="nft-image"
                      />
                    )}
                    
                    <div className="nft-content">
                      <h3 className="nft-title">
                        {listing.nft?.fields?.name || `NFT #${object.data.objectId.slice(-8)}`}
                      </h3>
                      
                      <p className="nft-description">
                        {listing.nft?.fields?.description || "No description available"}
                      </p>

                      <Flex justify="between" align="center" mb="3">
                        <div className="nft-price">
                          {priceInSui} SUI
                        </div>
                        <Text size="1" color="gray">
                          Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                        </Text>
                      </Flex>

                      <Flex gap="2">
                        <Button 
                          size="2" 
                          className={canBuy ? "gradient-button" : "outline-button"}
                          onClick={() => handleBuy(object.data.objectId, Number(listing.price))}
                          disabled={!canBuy || isPendingThis}
                          style={{ flex: 1 }}
                        >
                          {isPendingThis ? (
                            <Spinner size="1" />
                          ) : canBuy ? (
                            "🛒 Buy Now"
                          ) : (
                            "Your Listing"
                          )}
                        </Button>
                        
                        {canCancel && (
                          <Button 
                            size="2"
                            className="outline-button"
                            onClick={() => handleCancel(object.data.objectId)}
                            disabled={isPendingThis}
                          >
                            {isPendingThis ? <Spinner size="1" /> : "Cancel"}
                          </Button>
                        )}
                      </Flex>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <Flex gap="3" justify="between">
              <Button 
                className="outline-button"
                disabled={!data?.nextCursor}
                onClick={() => setCursor(data?.nextCursor ?? null)}
              >
                📄 Load More
              </Button>
              
              <Button 
                className="outline-button"
                onClick={() => {
                  setPollKey((k) => k + 1);
                  setAlert({ type: "success", message: "🔄 Marketplace refreshed!" });
                }}
              >
                🔄 Refresh
              </Button>
            </Flex>
          </>
        )}
      </Flex>
    </div>
  );
}