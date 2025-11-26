import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  solidity: {
    version: "0.8.28",
  },
  networks: {
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_URL || process.env.ALCHEMY_SEPOLIA_URL || "",
      // Нормализуем приватный ключ: добавляем префикс 0x при необходимости
      accounts: (() => {
        const raw = (process.env.PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY || process.env.RINKEBY_PRIVATE_KEY || "").trim();
        if (!raw) return [];
        const with0x = raw.startsWith("0x") ? raw : `0x${raw}`;
        return [with0x];
      })(),
      chainId: 11155111,
    },
  },
});
