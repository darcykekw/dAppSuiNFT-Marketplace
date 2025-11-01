import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import {
  Heading,
  Text,
  Flex,
  Button,
  Card,
  Spinner,
} from "@radix-ui/themes";
import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import {
  CONTRACT_MARKETPLACE_ID,
  CONTRACT_PACKAGE_ID,
  CONTRACT_MODULE_NAME,
  WITHDRAW_MARKETPLACE_FEES_METHOD,
  ADMIN_ADDRESS,
} from "./constants/smart-contract";

export default function Admin() {
  const account = useCurrentAccount();
  const isAdmin =
    !!account && account.address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  const [amount, setAmount] = useState(0);
  const [pending, setPending] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const {
    data: marketplaceObj,
    isPending: balanceLoading,
    refetch: refetchBalance,
  } = useSuiClientQuery(
    "getObject",
    {
      id: CONTRACT_MARKETPLACE_ID,
      options: { showContent: true },
    },
    { enabled: isAdmin, refetchInterval: 5000 },
  );

  const rawMist = marketplaceObj?.data?.content?.dataType === "moveObject" 
    ? (marketplaceObj.data.content.fields as any)?.balance 
    : undefined;

  const mistStr: string | undefined =
    typeof rawMist === "string"
      ? rawMist
      : typeof rawMist === "number"
      ? String(rawMist)
      : typeof rawMist === "bigint"
      ? rawMist.toString()
      : undefined;

  function formatSuiFromMist(m: string | undefined): string {
    if (!m) return "0";
    try {
      const mist = BigInt(m);
      const sui = Number(mist) / 1e9;
      return sui.toFixed(4);
    } catch {
      return "0";
    }
  }

  const balanceSui = formatSuiFromMist(mistStr);
  const availableBalance = mistStr ? BigInt(mistStr) : BigInt(0);

  function withdraw() {
    setAlert(null);
    
    if (!isAdmin) {
      setAlert({ type: "error", message: "❌ Unauthorized: Admin access required" });
      return;
    }
    
    if (amount <= 0) {
      setAlert({ type: "error", message: "❌ Amount must be greater than 0" });
      return;
    }
    
    const withdrawAmount = BigInt(Math.floor(amount * 1e9));
    
    if (withdrawAmount > availableBalance) {
      setAlert({ type: "error", message: "❌ Insufficient balance in marketplace" });
      return;
    }
    
    setPending(true);
    const txb = new Transaction();
    txb.moveCall({
      target: `${CONTRACT_PACKAGE_ID}::${CONTRACT_MODULE_NAME}::${WITHDRAW_MARKETPLACE_FEES_METHOD}`,
      arguments: [
        txb.object(CONTRACT_MARKETPLACE_ID),
        txb.pure.u64(amount * 1_000_000_000),
        txb.pure.address(account!.address),
      ],
    });
    
    signAndExecute(
      { transaction: txb },
      {
        onSuccess: () => {
          setAlert({ type: "success", message: "✅ Withdrawal submitted successfully" });
          setPending(false);
          setAmount(0);
          refetchBalance();
        },
        onError: (e) => {
          setAlert({ type: "error", message: `❌ Withdrawal failed: ${e.message}` });
          setPending(false);
        },
      },
    );
  }

  return (
    <div className="content-wrapper">
      <Flex direction="column" gap="6">
        {/* Admin Header */}
        <Card className="glass-card">
          <Flex align="center" gap="4">
            <div style={{ fontSize: '3rem' }}>⚙️</div>
            <Flex direction="column" gap="1">
              <Heading size="7" weight="bold">Admin Dashboard</Heading>
              <Text size="4" color="gray">
                Manage marketplace fees and settings
              </Text>
            </Flex>
            {isAdmin && (
              <div className="nft-price" style={{ fontSize: '0.9rem', padding: '0.25rem 0.75rem' }}>
                Admin Access
              </div>
            )}
          </Flex>
        </Card>

        {/* Stats Grid */}
        <div className="stats-grid">
          <Card className="glass-card">
            <Flex direction="column" gap="2">
              <Text size="2" color="gray">Marketplace Fee</Text>
              <Text size="6" weight="bold">2%</Text>
            </Flex>
          </Card>
          
          <Card className="glass-card">
            <Flex direction="column" gap="2">
              <Text size="2" color="gray">Marketplace ID</Text>
              <Text size="1" style={{ fontFamily: 'monospace' }} color="gray">
                {CONTRACT_MARKETPLACE_ID.slice(0, 8)}...{CONTRACT_MARKETPLACE_ID.slice(-6)}
              </Text>
            </Flex>
          </Card>
        </div>

        {/* Admin Panel */}
        {isAdmin ? (
          <Card className="glass-card">
            <Flex direction="column" gap="5">
              <Heading size="5">💰 Fee Management</Heading>
              
              {/* Balance Display */}
              <Card style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--accent)' }}>
                <Flex align="center" justify="between" p="4">
                  <Flex direction="column" gap="1">
                    <Text size="2" color="gray">Available Fees</Text>
                    <Flex align="center" gap="2">
                      {balanceLoading ? (
                        <Spinner size="2" />
                      ) : (
                        <Text size="6" weight="bold" style={{ background: 'var(--secondary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          {balanceSui} SUI
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                  <Button
                    size="1"
                    className="outline-button"
                    onClick={() => refetchBalance()}
                    disabled={balanceLoading || pending}
                  >
                    🔄 Refresh
                  </Button>
                </Flex>
              </Card>

              {/* Alert Messages */}
              {alert && (
                <Card className={alert.type === "success" ? "success-message" : "error-message"}>
                  <Text weight="medium">{alert.message}</Text>
                </Card>
              )}

              {/* Withdrawal Form */}
              <Flex direction="column" gap="3">
                <div className="form-group">
                  <label className="form-label">Withdrawal Amount (SUI)</label>
                  <input
                    type="number"
                    min={0.000000001}
                    step={0.000000001}
                    placeholder="0.00"
                    value={amount === 0 ? "" : amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    disabled={pending}
                    className="form-input"
                  />
                </div>
                
                <Button 
                  onClick={withdraw} 
                  disabled={pending}
                  className="gradient-button"
                  size="3"
                >
                  {pending ? (
                    <Flex align="center" gap="2">
                      <Spinner size="1" />
                      Processing Withdrawal...
                    </Flex>
                  ) : (
                    "💳 Withdraw Fees"
                  )}
                </Button>
              </Flex>
            </Flex>
          </Card>
        ) : (
          <Card className="glass-card">
            <Flex direction="column" align="center" gap="4" py="6">
              <div style={{ fontSize: '4rem' }}>🔒</div>
              <Heading size="5" align="center">Admin Access Required</Heading>
              <Text align="center" color="gray" size="4">
                Connect with an admin wallet to access marketplace fee management features
              </Text>
            </Flex>
          </Card>
        )}
      </Flex>
    </div>
  );
}