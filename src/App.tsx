import { ConnectButton } from "@mysten/dapp-kit";
import { Container, Flex, Heading, Button, Text } from "@radix-ui/themes";
import WalletStatus from "./WalletStatus";
import Marketplace from "./Marketplace";
import Admin from "./Admin";
import { useState } from "react";
import "./styles/App.css"; // Correct path - from src/styles/App.css

function App() {
  const [view, setView] = useState<"wallet" | "marketplace" | "admin">("wallet");

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="app-header">
        <Flex justify="between" align="center" className="header-content">
          <Flex align="center" gap="3">
            <div className="logo">
              🎨
            </div>
            <Heading size="5" weight="bold" className="app-title">
              Sui NFT Marketplace
            </Heading>
          </Flex>

          <Flex gap="3" align="center">
            <nav className="nav-buttons">
              <Button 
                variant={view === "wallet" ? "solid" : "soft"} 
                size="2"
                onClick={() => setView("wallet")}
                className="nav-button"
              >
                🏠 My Collection
              </Button>
              <Button 
                variant={view === "marketplace" ? "solid" : "soft"} 
                size="2"
                onClick={() => setView("marketplace")}
                className="nav-button"
              >
                🛍️ Marketplace
              </Button>
              <Button 
                variant={view === "admin" ? "solid" : "soft"} 
                size="2"
                onClick={() => setView("admin")}
                className="nav-button"
              >
                ⚙️ Admin
              </Button>
            </nav>
            <ConnectButton />
          </Flex>
        </Flex>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <Container size="3">
          <div className="content-wrapper">
            {view === "wallet" && <WalletStatus />}
            {view === "marketplace" && <Marketplace />}
            {view === "admin" && <Admin />}
          </div>
        </Container>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <Text size="2" color="gray">
          Built on Sui Blockchain • Powered by Web3 Technology
        </Text>
      </footer>
    </div>
  );
}

export default App;