import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast, ToastContainer } from "react-toastify";
import { Button } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import "./WalletConnect.css";
import metamaskIcon from "src/assets/img/metamask-icon.png";
import phantomIcon from "src/assets/img/Phantom-Icon.png";
const WALLET_TYPES = {
  METAMASK: "MetaMask",
  PHANTOM: "Phantom",
};

const WalletConnect = () => {
  //Manages wallet connection state
  const [walletAddress, setWalletAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [walletType, setWalletType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  //Detects available wallets
  // Checks for existing connections

  useEffect(() => {
    detectWallets();
    checkConnection();

    const savedWalletType = localStorage.getItem("walletType");
    const savedWalletAddress = localStorage.getItem("walletAddress");
    const savedNetwork = localStorage.getItem("network");

    if (savedWalletType && savedWalletAddress && savedNetwork) {
      setWalletType(savedWalletType);
      setWalletAddress(savedWalletAddress);
      setNetwork(savedNetwork);
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountChange);
      window.ethereum.on("disconnect", handleDisconnect);
    }
    if (window.solana) {
      window.solana.on("disconnect", handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountChange);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      }
      if (window.solana) {
        window.solana.removeListener("disconnect", handleDisconnect);
      }
    };
  }, []);

  //Detects which wallets are installed in the browser
  const detectWallets = () => {
    const wallets = [];

    // Detect MetaMask
    if (window.ethereum?.isMetaMask) {
      wallets.push({
        type: WALLET_TYPES.METAMASK,
        name: "MetaMask",
        icon: metamaskIcon,
      });
    }

    // Detect Phantom
    if (window.solana?.isPhantom) {
      wallets.push({
        type: WALLET_TYPES.PHANTOM,
        name: "Phantom",
        icon: phantomIcon,
      });
    }

    setAvailableWallets(wallets);
  };

  const checkConnection = async () => {
    try {
      if (window.ethereum && window.ethereum.selectedAddress) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        const network = await provider.getNetwork();

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setNetwork(network.name);
          setWalletType(WALLET_TYPES.METAMASK);
        }
      }

      if (window.solana?.isConnected && window.solana.publicKey) {
        const publicKey = window.solana.publicKey.toString();
        setWalletAddress(publicKey);
        setNetwork("Solana");
        setWalletType(WALLET_TYPES.PHANTOM);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      handleDisconnect();
    }
  };

  const showToast = (message, type = "success") => {
    toast[type](message, {
      position: "bottom-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: {
        display: "flex",
        marginBottom: "50px",
        color: type === "error" ? "#fff" : "#333",
        backgroundColor: type === "error" ? "#ff4d4f" : "#52c41a",
        fontWeight: "bold",
      },
    });
  };

  //Handles wallet connection based on selected wallet type
  const connectWallet = async (walletType) => {
    try {
      if (!walletType) {
        return;
      }

      switch (walletType) {
        case WALLET_TYPES.METAMASK:
          if (!window.ethereum) {
            showToast("Please install MetaMask!", "error");
            return;
          }

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          const network = await provider.getNetwork();

          setWalletAddress(accounts[0]);
          setNetwork(network.name);
          setWalletType(WALLET_TYPES.METAMASK);
          localStorage.setItem("walletType", WALLET_TYPES.METAMASK);
          localStorage.setItem("walletAddress", accounts[0]);
          localStorage.setItem("network", network.name);
          showToast("MetaMask wallet connected successfully! 🦊");
          break;

        case WALLET_TYPES.PHANTOM:
          if (!window.solana?.isPhantom) {
            showToast("Please install Phantom Wallet!", "error");
            return;
          }

          const resp = await window.solana.connect();
          setWalletAddress(resp.publicKey.toString());
          setNetwork("Solana");
          setWalletType(WALLET_TYPES.PHANTOM);
          localStorage.setItem("walletType", WALLET_TYPES.PHANTOM);
          localStorage.setItem("walletAddress", resp.publicKey.toString());
          localStorage.setItem("network", "Solana");
          showToast("Phantom wallet connected successfully! 👻");
          break;

        default:
          throw new Error("Unsupported wallet type");
      }

      setShowWalletOptions(false);
    } catch (error) {
      console.error("Connection error:", error);
      showToast(error.message, "error");
      handleDisconnect();
    }
  };

  const handleAccountChange = async (accounts) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      setWalletAddress(accounts[0]);
    }
  };

  //Handles wallet disconnection
  const handleDisconnect = async () => {
    try {
      if (walletType === WALLET_TYPES.PHANTOM && window.solana) {
        await window.solana.disconnect();
      }

      setWalletAddress("");
      setNetwork("");
      setWalletType("");
      setSelectedWallet("");
      setShowModal(false);
      setShowWalletOptions(false);
      localStorage.removeItem("walletType");
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("network");
      showToast("Wallet disconnected successfully! 👋");
    } catch (error) {
      console.error("Error disconnecting:", error);
      showToast("Error disconnecting wallet", "error");
    }
  };

  const handleConnectClick = () => {
    setShowWalletOptions(true);
  };

  const handleModalClose = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      setShowModal(false);
    }
  };

  return (
    <div className="wallet-connect-container">
      <div className="wallet-connect">
        {!walletAddress ? (
          <>
          
           <Button
            variant="contained"
            sx={{
              backgroundColor: "#00dbe3",
              borderRadius: "6px",
              width: "352px",
              height: "64px",
              fontSize: "24px",
              lineHeight: "60px",
              textTransform: "uppercase",
              color: "#ffffff",
              fontWeight: 700,
            }}
            onClick={handleConnectClick}
          >
           Connect Wallet
          </Button>
            {showWalletOptions && (
              <div
                className="modal-overlay"
                onClick={() => setShowWalletOptions(false)}
              >
                <div className="modal-content" style={{ gap: "25px" }}>
                  <div className="close-cont">
                    <div
                      className="modal-close"
                      onClick={() => setShowWalletOptions(false)}
                    >
                      ×
                    </div>
                  </div>
                  <div
                    className="modal-header"
                    style={{ marginBottom: "25px" }}
                  >
                    <h3>Connect Wallet to Continue</h3>
                  </div>
                  <div className="modal-body">
                    <div className="wallet-list">
                      {availableWallets.map((wallet) => (
                        <div
                          key={wallet.type}
                          className={`wallet-option-btn ${
                            selectedWallet === wallet.type ? "selected" : ""
                          }`}
                          onClick={() => {
                            setSelectedWallet(wallet.type);
                            connectWallet(wallet.type);
                          }}
                        >
                          <div className="wallet-name-cont">
                            <img
                              src={wallet.icon}
                              alt={`${wallet.name} icon`}
                              className="wallet-icon"
                            />
                            <text className="wallet-name">{wallet.name}</text>
                          </div>
                          <text style={{ color: "#b3b3b3" }}>Detected</text>
                        </div>
                      ))}
                      {availableWallets.length === 0 && (
                        <p className="no-wallets">
                          No wallets detected. Please install MetaMask or
                          Phantom.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
             <Button
            variant="contained"
            sx={{
              backgroundColor: "#00dbe3",
              borderRadius: "6px",
              width: "352px",
              height: "64px",
              fontSize: "24px",
              lineHeight: "60px",
              textTransform: "uppercase",
              gap:"15px",
              color: "#ffffff",
              fontWeight: 700,
            }}
              onClick={() => setShowModal(true)}
            >
              <img
                src={selectedWallet === "MetaMask" ? metamaskIcon : phantomIcon}
                alt={`${selectedWallet === "MetaMask" ? "Metamask" : "Phantom"} icon`}
                className="wallet-icon"
                style={{ width: "30px", height: "30px" }}
              />
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-3)}
            </Button>

            {showModal && (
              <div className="modal-overlay" onClick={handleModalClose}>
                <div className="modal-content" style={{ gap: "10px" }}>
                  <div className="close-cont">
                    <div
                      className="modal-close-account"
                      onClick={() => setShowModal(false)}
                    >
                      ×
                    </div>
                  </div>
                  <div className="modal-header">
                    <h1 style={{ color: "white" }}>
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-3)}
                    </h1>
                  </div>
                  <div className="modal-body" style={{ marginTop: "15px" }}>
                    <button
                      className="copy-button"
                      onClick={() => {
                        navigator.clipboard.writeText(walletAddress);
                        showToast("Wallet address copied to clipboard!");
                      }}
                    >
                      Copy wallet Address
                    </button>

                    <div onClick={handleDisconnect} className="disconnect-btn">
                      Disconnect Wallet
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <ToastContainer
        position="bottom-right"
        theme="colored"
        limit={1}
      />
    </div>
  );
};

export default WalletConnect;
