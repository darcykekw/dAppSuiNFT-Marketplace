import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { Flex, Heading, Text, Badge, Card } from "@radix-ui/themes";
import { OwnedObjects } from "./OwnedObjects";

export default function WalletStatus() {
  const account = useCurrentAccount();
  const { data: balance, isPending } = useSuiClientQuery(
    "getBalance",
    { owner: account?.address || "" },
    { enabled: !!account },
  );

  function formatSui(mist: string | number | undefined) {
    if (!mist) return "0";
    return (Number(mist) / 1_000_000_000).toLocaleString(undefined, {
      maximumFractionDigits: 6,
    });
  }

  return (
    <div className="content-wrapper">
      <Flex direction="column" gap="6">
        {/* Wallet Overview Card */}
        <Card className="glass-card">
          <Flex direction="column" gap="4">
            <Flex align="center" justify="between">
              <Heading size="7" weight="bold">👛 Wallet Overview</Heading>
              <Badge size="2" color="green">Connected</Badge>
            </Flex>
            
            {account ? (
              <Flex gap="6" wrap="wrap">
                <Flex direction="column" gap="2">
                  <Text size="2" color="gray">Wallet Address</Text>
                  <Text style={{ fontFamily: 'monospace' }} size="3" weight="medium">
                    {account.address.slice(0, 10)}...{account.address.slice(-8)}
                  </Text>
                </Flex>
                
                <Flex direction="column" gap="2">
                  <Text size="2" color="gray">SUI Balance</Text>
                  <Flex align="center" gap="2">
                    <Text size="4" weight="bold" className="nft-price">
                      {isPending ? "..." : formatSui(balance?.totalBalance)} SUI
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            ) : (
              <Card className="glass-card">
                <Flex direction="column" align="center" gap="3" py="4">
                  <Text size="5" weight="bold">🔗 Connect Your Wallet</Text>
                  <Text align="center" color="gray">
                    Connect your Sui wallet to view your NFT collection and start trading
                  </Text>
                </Flex>
              </Card>
            )}
          </Flex>
        </Card>

        {/* NFT Collection Section */}
        <OwnedObjects />
      </Flex>
    </div>
  );
}