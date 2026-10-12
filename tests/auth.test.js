const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { SignJWT, jwtVerify } = require("jose");

const JWT_SECRET = new TextEncoder().encode("test_jwt_secret_key_minimum_32_characters_long_12345");

test("Auth: Password hashing & comparison", async () => {
  const plain = "SecurePassword@123";
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(plain, salt);

  assert.notEqual(plain, hashed);
  assert.equal(await bcrypt.compare(plain, hashed), true);
  assert.equal(await bcrypt.compare("WrongPassword", hashed), false);
});

test("Auth: JWT session token issuance and verification", async () => {
  const userPayload = {
    id: "user-123",
    email: "test@example.com",
    role: "FOOD_PROVIDER",
  };

  const token = await new SignJWT(userPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);

  assert.ok(typeof token === "string" && token.length > 20);

  const { payload } = await jwtVerify(token, JWT_SECRET);
  assert.equal(payload.id, userPayload.id);
  assert.equal(payload.email, userPayload.email);
  assert.equal(payload.role, userPayload.role);
});

test("Auth: Rejects invalid or tampered JWT tokens", async () => {
  const badSecret = new TextEncoder().encode("different_wrong_secret_key_32_chars_1234");
  const token = await new SignJWT({ id: "user-1" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(badSecret);

  await assert.rejects(async () => {
    await jwtVerify(token, JWT_SECRET);
  });
});