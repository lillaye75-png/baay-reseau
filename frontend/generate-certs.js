const { generateKeyPairSync, createSign, createHash, randomBytes } = require("crypto");
const { writeFileSync, mkdirSync } = require("fs");

mkdirSync("certs", { recursive: true });

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const serialNumber = randomBytes(16).toString("hex");
const now = new Date();
const notAfter = new Date(now);
notAfter.setFullYear(notAfter.getFullYear() + 5);

const pad = (n, len = 2) => String(n).padStart(len, "0");
const toASN1Date = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

function encodeLength(len) {
  if (len < 0x80) return Buffer.from([len]);
  const bytes = [];
  let l = len;
  while (l > 0) {
    bytes.unshift(l & 0xff);
    l >>= 8;
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function encodeSequence(...items) {
  const content = Buffer.concat(items.map((item) => {
    if (Buffer.isBuffer(item)) return item;
    return Buffer.from(item, "hex");
  }));
  return Buffer.concat([Buffer.from([0x30]), encodeLength(content.length), content]);
}

function encodeOID(oid) {
  const parts = oid.split(".").map(Number);
  const bytes = [(parts[0] * 40) + parts[1]];
  for (let i = 2; i < parts.length; i++) {
    let val = parts[i];
    const temp = [];
    while (val > 0x7f) {
      temp.unshift(val & 0x7f);
      val >>= 7;
    }
    temp.unshift(val);
    for (let j = 0; j < temp.length - 1; j++) temp[j] |= 0x80;
    bytes.push(...temp);
  }
  return Buffer.concat([Buffer.from([0x06]), encodeLength(bytes.length), Buffer.from(bytes)]);
}

function encodeNull() {
  return Buffer.from([0x05, 0x00]);
}

function encodeInteger(val) {
  const hex = typeof val === "string" ? val : val.toString(16).padStart(2, "0");
  const bytes = Buffer.from(hex, "hex");
  const needsPad = bytes[0] & 0x80;
  const padded = needsPad ? Buffer.concat([Buffer.from([0x00]), bytes]) : bytes;
  return Buffer.concat([Buffer.from([0x02]), encodeLength(padded.length), padded]);
}

function encodeBitString(bits) {
  return Buffer.concat([Buffer.from([0x03]), encodeLength(bits.length + 1), Buffer.from([0x00]), bits]);
}

function encodeSet(...items) {
  const content = Buffer.concat(items);
  return Buffer.concat([Buffer.from([0x31]), encodeLength(content.length), content]);
}

function encodeExplicit(tag, content) {
  return Buffer.concat([Buffer.from([0xa0 | tag]), encodeLength(content.length), content]);
}

// TBSCertificate
const tbs = encodeSequence(
  encodeExplicit(0, encodeInteger(Buffer.from(serialNumber, "hex"))),
  encodeSequence(
    encodeInteger(2),
    encodeInteger(Buffer.from([0x00])),
    encodeSequence(encodeOID("2.5.4.3"), { tag: 0x0c, value: "Baay Reseau Dev" })
  ),
  encodeSequence(encodeOID("1.2.840.113549.1.1.11"), encodeNull()),
  encodeSequence(encodeOID("2.5.4.3"), { tag: 0x0c, value: "localhost" }),
  encodeSequence(
    encodeExplicit(0, encodeOID("2.5.29.17")),
    encodeExplicit(1, Buffer.from("0527302582096c6f63616c686f737482083132372e302e302e31", "hex"))
  ),
  encodeSequence(
    toASN1Date(now),
    toASN1Date(notAfter)
  ),
  encodeSequence(
    encodeOID("2.5.4.3"),
    { tag: 0x0c, value: "localhost" }
  ),
  encodeSequence(
    encodeOID("1.2.840.113549.1.1.1"),
    encodeNull()
  ),
);

const hash = createHash("sha256").update(tbs).digest();
const sign = createSign("RSA-SHA256").update(tbs).sign(privateKey);
const sig = encodeBitString(sign);

const cert = encodeSequence(tbs, encodeSequence(encodeOID("1.2.840.113549.1.1.11"), encodeNull()), sig);

writeFileSync("certs/key.pem", privateKey);
writeFileSync("certs/cert.pem", cert);
console.log("SSL certs generated in certs/");
