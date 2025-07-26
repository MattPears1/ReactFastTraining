const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.push({
          name: name,
          address: interface.address
        });
      }
    }
  }
  
  // Prioritize common network interface names
  const priority = ['Wi-Fi', 'Wireless', 'wlan0', 'en0', 'eth0'];
  
  for (const prio of priority) {
    const found = addresses.find(addr => 
      addr.name.toLowerCase().includes(prio.toLowerCase())
    );
    if (found) return found.address;
  }
  
  // Look for 192.168.x.x addresses (common home network range)
  const homeNetwork = addresses.find(addr => 
    addr.address.startsWith('192.168.')
  );
  if (homeNetwork) return homeNetwork.address;
  
  // Return first available if no priority match
  return addresses.length > 0 ? addresses[0].address : 'localhost';
}

console.log('Your WiFi IP address is:', getLocalIP());
console.log('\nAll network interfaces:');
const interfaces = os.networkInterfaces();
for (const [name, addrs] of Object.entries(interfaces)) {
  for (const addr of addrs) {
    if (addr.family === 'IPv4' && !addr.internal) {
      console.log(`  ${name}: ${addr.address}`);
    }
  }
}