// Плагин Hardhat Ethers больше не обязателен: используем чистый ethers v6 и артефакты.
// Скрипт можно запускать как через `npx hardhat run`, так и напрямую `node scripts/deploy.js`.

import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function requireEnv(name, fallback) {
  const v = process.env[name] ?? fallback ?? "";
  if (!v) throw new Error(`Переменная окружения ${name} не задана`);
  return v;
}

function normalizePrivateKey(pk) {
  const raw = (pk || "").trim();
  if (!raw) throw new Error("PRIVATE_KEY пустой");
  const with0x = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(with0x)) {
    throw new Error("PRIVATE_KEY имеет некорректный формат: ожидается 64-байтовый hex с префиксом 0x");
  }
  return with0x;
}

async function main() {
  // 1) Получаем RPC и приватный ключ из .env
  const rpcUrl = process.env.SEPOLIA_URL || process.env.ALCHEMY_SEPOLIA_URL || "";
  if (!rpcUrl) {
    throw new Error("Не задан RPC URL: укажите SEPOLIA_URL или ALCHEMY_SEPOLIA_URL в .env");
  }
  const pk = normalizePrivateKey(
    process.env.PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY || process.env.RINKEBY_PRIVATE_KEY || ""
  );

  // 2) Загружаем артефакт контракта Anton
  const artifactPath = path.resolve(projectRoot, "artifacts", "contracts", "Anton.sol", "Anton.json");
  let artifact;
  try {
    const raw = readFileSync(artifactPath, "utf8");
    artifact = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `Не найден артефакт ${artifactPath}. Сначала выполните компиляцию: npx hardhat compile`
    );
  }
  const { abi, bytecode } = artifact;
  if (!abi || !bytecode) {
    throw new Error("Некорректный артефакт: отсутствуют abi/bytecode");
  }

  // 3) Провайдер и кошелёк
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log("Deploying contracts with the account:", wallet.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // 4) Деплой
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Token address:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});