#!/usr/bin/env node
// Simple environment checker for Sepolia deploy
// Usage: npm run doctor

import fs from "fs";
import path from "path";
import url from "url";
import dotenv from "dotenv";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const problems = [];
const warnings = [];

// Check RPC URL
const rpc = process.env.SEPOLIA_URL || process.env.ALCHEMY_SEPOLIA_URL || "";
if (!rpc) {
  problems.push(
    "Не задан RPC URL для Sepolia. Укажите SEPOLIA_URL (рекомендуется) или ALCHEMY_SEPOLIA_URL в .env"
  );
} else {
  const looksLikeMainnetAlchemy = /eth-mainnet\.g\.alchemy\.com\/v2\//.test(rpc);
  if (looksLikeMainnetAlchemy) {
    problems.push(
      "RPC URL указывает на mainnet Alchemy. Для деплоя в Sepolia используйте https://eth-sepolia.g.alchemy.com/v2/<KEY>"
    );
  }
  if (/\-$/.test(rpc)) {
    warnings.push("RPC URL выглядит обрезанным (заканчивается на '-') — проверьте ключ.");
  }
}

// Check private key presence and format
const rawKey = (process.env.PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY || process.env.RINKEBY_PRIVATE_KEY || "").trim();
if (!rawKey) {
  problems.push(
    "Не найден PRIVATE_KEY в .env (или SEPOLIA_PRIVATE_KEY/RINKEBY_PRIVATE_KEY). Добавьте приватный ключ аккаунта с тестовыми ETH в Sepolia."
  );
} else {
  const key = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
  const hexRe = /^0x[0-9a-fA-F]{64}$/;
  if (!hexRe.test(key)) {
    problems.push(
      "PRIVATE_KEY имеет некорректный формат. Ожидается 64-байтовый hex с префиксом 0x."
    );
  } else if (!rawKey.startsWith("0x")) {
    warnings.push(
      "PRIVATE_KEY без префикса 0x — он будет автоматически добавлен при использовании, но лучше исправить в .env."
    );
  }
}

// Basic dependency presence check (optional)
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  await import("@nomicfoundation/hardhat-ethers");
} catch (e) {
  problems.push(
    "Плагин @nomicfoundation/hardhat-ethers не найден. Выполните: npm install"
  );
}

try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  await import("ethers");
} catch (e) {
  problems.push("Пакет ethers не найден. Выполните: npm install");
}

// Output
if (problems.length === 0 && warnings.length === 0) {
  console.log("✓ Окружение выглядит корректным для деплоя в Sepolia.");
  process.exit(0);
}

if (warnings.length) {
  console.log("Предупреждения:");
  for (const w of warnings) console.log(" -", w);
}

if (problems.length) {
  console.error("Найдены проблемы, требующие исправления:");
  for (const p of problems) console.error(" -", p);
  process.exit(1);
}
