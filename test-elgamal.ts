// Test ElGamal encryption/decryption
import { generateElGamalKeypair, encryptAmount, decryptAmount } from './packages/core/dist/index.js';

async function test() {
  console.log('🔑 Generating ElGamal keypair...');
  const keys = generateElGamalKeypair();
  console.log('Private key:', keys.privateKey.substring(0, 16) + '...');
  console.log('Public key X:', keys.publicKey.x.substring(0, 16) + '...');
  console.log('Public key Y:', keys.publicKey.y.substring(0, 16) + '...');
  
  console.log('\n🔒 Encrypting amount: 10000 lamports (0.00001 SOL)');
  const encrypted = encryptAmount(10000n, keys.publicKey);
  console.log('C1:', encrypted.c1.x.substring(0, 16) + '...');
  console.log('C2:', encrypted.c2.x.substring(0, 16) + '...');
  
  console.log('\n🔓 Decrypting...');
  const decrypted = decryptAmount(encrypted, keys.privateKey);
  console.log('Decrypted amount:', decrypted.toString(), 'lamports');
  
  if (decrypted === 10000n) {
    console.log('✅ Encryption/Decryption works!');
  } else {
    console.log('❌ Decryption failed! Expected 10000, got', decrypted.toString());
  }
}

test().catch(console.error);

