import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import {
  Flex,
  Heading,
  Text,
  Card,
  Button,
  TextField,
  Callout,
  Grid,
  Badge,
  Spinner,
} from "@radix-ui/themes";
import {
  CONTRACT_PACKAGE_ID,
  CONTRACT_MODULE_NAME,
  MINT_NFT_METHOD,
  LIST_NFT_METHOD,
  BURN_NFT_METHOD,
  CONTRACT_MARKETPLACE_ID,
} from "./constants/smart-contract";
import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";

const NFT_STRUCT_TYPE = `${CONTRACT_PACKAGE_ID}::${CONTRACT_MODULE_NAME}::NFT`;

// Mint form component
function MintNFTForm({ onSuccess }: { onSuccess: () => void }) {
  const [fields, setFields] = useState({ name: "", description: "", url: "" });
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    onSuccess: () => {
      setStatus("success");
      setFields({ name: "", description: "", url: "" });
      onSuccess();
    },
    onError: (e) => {
      setError((e as Error).message ?? "Minting failed");
      setStatus("error");
    },
  });

  function validate() {
    if (!fields.name.trim()) return "Name is required";
    if (!fields.description.trim()) return "Description is required";
    if (!fields.url.trim()) return "Image URL is required";
    return null;
  }

  // ADD BACK THE MISSING handleChange FUNCTION
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // DEBUG LOGS
    console.log("🔍 CURRENT CONTRACT PACKAGE ID:", CONTRACT_PACKAGE_ID);
    console.log("🔍 CURRENT CONTRACT MODULE NAME:", CONTRACT_MODULE_NAME);
    
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      setStatus("error");
      return;
    }
    
    setStatus("pending");
    const txb = new Transaction();
    
    // TEST 1: Try with 4 arguments (add marketplace object)
    txb.moveCall({
      target: `${CONTRACT_PACKAGE_ID}::${CONTRACT_MODULE_NAME}::${MINT_NFT_METHOD}`,
      arguments: [
        txb.pure.string(fields.name),
        txb.pure.string(fields.description),
        txb.pure.string(fields.url),
        txb.object(CONTRACT_MARKETPLACE_ID), // ADDED: 4th argument
      ],
    });
    
    signAndExecute({ transaction: txb });
  }

  return (
    <Card className="glass-card">
      <Flex direction="column" gap="3">
        <Heading size="4">✨ Create New NFT</Heading>
        
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <TextField.Root
              name="name"
              placeholder="NFT Name"
              value={fields.name}
              onChange={handleChange}
              disabled={status === "pending"}
              size="2"
            />
            <TextField.Root
              name="description"
              placeholder="NFT Description"
              value={fields.description}
              onChange={handleChange}
              disabled={status === "pending"}
              size="2"
            />
            <TextField.Root
              name="url"
              placeholder="Image URL"
              value={fields.url}
              onChange={handleChange}
              disabled={status === "pending"}
              size="2"
            />
            
            <Button 
              type="submit" 
              disabled={status === "pending"}
              size="2"
              className="gradient-button"
            >
              {status === "pending" ? (
                <Flex align="center" gap="2">
                  <Spinner size="1" />
                  Minting...
                </Flex>
              ) : (
                "🎨 Mint NFT"
              )}
            </Button>
          </Flex>
        </form>

        {error && (
          <Callout.Root color="red" size="1">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}
        
        {status === "success" && (
          <Callout.Root color="green" size="1">
            <Callout.Text>✅ NFT minted successfully!</Callout.Text>
          </Callout.Root>
        )}
      </Flex>
    </Card>
  );
}

function ListForSaleForm({ nftId, onListed }: { nftId: string; onListed: () => void }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    onSuccess: () => {
      setStatus("success");
      setPrice(0);
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 1500);
      onListed();
    },
    onError: (e) => {
      setError((e as Error).message ?? "Listing failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    // Client-side validation - prevent listing price of 0 or negative
    if (isNaN(price) || price <= 0) {
      setError("Price must be greater than 0 SUI");
      setStatus("error");
      return;
    }
    
    setStatus("pending");
    const txb = new Transaction();
    txb.moveCall({
      target: `${CONTRACT_PACKAGE_ID}::${CONTRACT_MODULE_NAME}::${LIST_NFT_METHOD}`,
      arguments: [txb.object(nftId), txb.pure.u64(price * 1_000_000_000)],
    });
    signAndExecute({ transaction: txb });
  }

  if (!open)
    return (
      <Button size="1" onClick={() => setOpen(true)} className="outline-button">
        📈 List for Sale
      </Button>
    );

  return (
    <Flex direction="column" gap="2">
      <Text size="1" weight="medium">Set Price in SUI</Text>
      <form onSubmit={handleSubmit}>
        <Flex gap="2" align="center">
          <TextField.Root
            type="number"
            min={0.000000001}
            step={0.000000001}
            placeholder="0.00"
            value={price === 0 ? "" : price}
            onChange={(e) => setPrice(Number(e.target.value))}
            disabled={status === "pending"}
            size="1"
            style={{ width: 120 }}
          />
          <Text size="1" color="gray">SUI</Text>
          <Button type="submit" size="1" disabled={status === "pending"} className="gradient-button">
            {status === "pending" ? <Spinner size="1" /> : "List"}
          </Button>
          <Button
            color="gray"
            size="1"
            type="button"
            onClick={() => setOpen(false)}
            disabled={status === "pending"}
            className="outline-button"
          >
            Cancel
          </Button>
        </Flex>
      </form>
      
      {error && (
        <Callout.Root color="red" size="1">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      
      {status === "success" && (
        <Callout.Root color="green" size="1">
          <Callout.Text>✅ Listed successfully!</Callout.Text>
        </Callout.Root>
      )}
    </Flex>
  );
}

function BurnNFTButton({ nftId, onBurned }: { nftId: string; onBurned: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    onSuccess: () => {
      setPending(false);
      onBurned();
    },
    onError: (e) => {
      setError((e as Error).message ?? "Burn failed");
      setPending(false);
    },
  });

  function burn() {
    setError(null);
    setPending(true);
    const txb = new Transaction();
    txb.moveCall({
      target: `${CONTRACT_PACKAGE_ID}::${CONTRACT_MODULE_NAME}::${BURN_NFT_METHOD}`,
      arguments: [txb.object(nftId)],
    });
    signAndExecute({ transaction: txb });
  }

  return (
    <Flex direction="column" gap="1">
      <Button color="red" size="1" onClick={burn} disabled={pending} className="outline-button">
        {pending ? <Spinner size="1" /> : "🔥 Burn"}
      </Button>
      {error && (
        <Callout.Root color="red" size="1">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
    </Flex>
  );
}

export function OwnedObjects() {
  const account = useCurrentAccount();
  const { data, isPending, error, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: { StructType: NFT_STRUCT_TYPE },
      options: { showContent: true },
    },
    {
      enabled: !!account,
    },
  );

  if (!account) return null;
  
  if (error) return (
    <Callout.Root color="red">
      <Callout.Text>Error loading NFTs: {error.message}</Callout.Text>
    </Callout.Root>
  );
  
  if (isPending || !data) return (
    <Flex align="center" justify="center" py="8">
      <Spinner size="3" />
      <Text ml="2">Loading your NFTs...</Text>
    </Flex>
  );

  return (
    <Flex direction="column" gap="6">
      <MintNFTForm onSuccess={() => refetch()} />
      
      <Flex direction="column" gap="4">
        <Flex align="center" justify="between">
          <Heading size="5">🖼️ Your NFT Collection</Heading>
          <Badge size="2" color="blue">{data.data.length} items</Badge>
        </Flex>

        {data.data.length === 0 ? (
          <Card className="glass-card">
            <Flex direction="column" align="center" py="8" gap="3">
              <Text size="6">🎨</Text>
              <Heading size="5" align="center">No NFTs Yet</Heading>
              <Text align="center" color="gray" size="3">
                Mint your first NFT to start building your collection
              </Text>
            </Flex>
          </Card>
        ) : (
          <Grid columns="2" gap="4" width="auto">
            {data.data.map((object) => {
              const objectId = object.data?.objectId;
              const fields =
                (object.data?.content &&
                  object.data?.content.dataType === "moveObject" &&
                  (object.data.content as any).fields) ||
                undefined;

              return (
                <div key={objectId} className="nft-card">
                  {fields?.url && (
                    <img
                      src={fields.url}
                      alt={fields?.name || "NFT Image"}
                      className="nft-image"
                    />
                  )}
                  
                  <div className="nft-content">
                    <h3 className="nft-title">
                      {fields?.name || `NFT #${objectId?.slice(-8)}`}
                    </h3>
                    
                    <p className="nft-description">
                      {fields?.description || "No description available"}
                    </p>

                    <Text size="1" color="gray" style={{ fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace' }}>
                      ID: {objectId?.slice(0, 8)}...{objectId?.slice(-6)}
                    </Text>

                    <Flex gap="2" mt="3">
                      <ListForSaleForm nftId={objectId!} onListed={() => refetch()} />
                      <BurnNFTButton nftId={objectId!} onBurned={() => refetch()} />
                    </Flex>
                  </div>
                </div>
              );
            })}
          </Grid>
        )}
      </Flex>
    </Flex>
  );
}