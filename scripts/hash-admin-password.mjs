import { randomBytes, scryptSync } from "node:crypto";

async function readPassword() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    let input = "";
    for await (const chunk of process.stdin) input += chunk;
    return input.replace(/[\r\n]+$/, "");
  }

  process.stderr.write("Admin password (input hidden): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve) => {
    let input = "";
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stderr.write("\n");
      resolve(input);
    };
    process.stdin.on("data", (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          process.stdin.setRawMode(false);
          process.stderr.write("\n");
          process.exit(130);
        }
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u007f" || character === "\b") input = input.slice(0, -1);
        else input += character;
      }
    });
  });
}

const password = await readPassword();
if (!password || password.length < 12) {
  console.error("Password must contain at least 12 characters. Run `npm run admin:hash` and enter it at the hidden prompt.");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`scrypt$${salt}$${hash}`);
