// Test ZK proof generation with real circuits
import { CIRCUIT_URLS } from './packages/core/dist/index.js';

async function testCircuitAccess() {
  console.log('🔍 Testing Circuit File Access...\n');
  
  console.log('Circuit URLs:');
  console.log('  WASM:', CIRCUIT_URLS.wasm);
  console.log('  ZKEY:', CIRCUIT_URLS.zkey);
  console.log('  VKEY:', CIRCUIT_URLS.vkey);
  console.log('');
  
  // Test verification key
  console.log('📥 Fetching verification key...');
  try {
    const vkeyResponse = await fetch(CIRCUIT_URLS.vkey);
    if (!vkeyResponse.ok) {
      throw new Error(`HTTP ${vkeyResponse.status}: ${vkeyResponse.statusText}`);
    }
    const vkey = await vkeyResponse.json();
    console.log('✅ Verification key loaded successfully!');
    console.log('   Protocol:', vkey.protocol);
    console.log('   Curve:', vkey.curve);
    console.log('   Public Inputs:', vkey.nPublic);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to load verification key:', error);
    return;
  }
  
  // Test WASM file (just check if accessible)
  console.log('📥 Checking WASM file...');
  try {
    const wasmResponse = await fetch(CIRCUIT_URLS.wasm, { method: 'HEAD' });
    if (!wasmResponse.ok) {
      throw new Error(`HTTP ${wasmResponse.status}: ${wasmResponse.statusText}`);
    }
    const size = wasmResponse.headers.get('content-length');
    console.log('✅ WASM file accessible!');
    if (size) {
      console.log(`   Size: ${(parseInt(size) / 1024 / 1024).toFixed(2)} MB`);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Failed to access WASM file:', error);
    return;
  }
  
  // Test ZKEY file (just check if accessible)
  console.log('📥 Checking ZKEY file...');
  try {
    const zkeyResponse = await fetch(CIRCUIT_URLS.zkey, { method: 'HEAD' });
    if (!zkeyResponse.ok) {
      throw new Error(`HTTP ${zkeyResponse.status}: ${zkeyResponse.statusText}`);
    }
    const size = zkeyResponse.headers.get('content-length');
    console.log('✅ ZKEY file accessible!');
    if (size) {
      console.log(`   Size: ${(parseInt(size) / 1024 / 1024).toFixed(2)} MB`);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Failed to access ZKEY file:', error);
    return;
  }
  
  console.log('🎉 All circuit files are accessible and ready for use!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Test proof generation in the browser');
  console.log('  2. Connect wallet in Next.js example');
  console.log('  3. Make a payment and generate proof');
}

testCircuitAccess().catch(console.error);

