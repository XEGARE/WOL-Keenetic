# Node.js script setup for sending magic packets via Keenetic Router

This script, written in **Node.js**, sends a **magic packet** to a target device to turn it on via a Keenetic router.

## Installation Steps

### 1. Clone the repository and install Dependencies
On your main system, clone the repository and install the required dependencies using npm:

```bash
git clone https://github.com/XEGARE/WOL-Keenetic.git
cd WOL-Keenetic\WOL-Keenetic
npm install
```

### 2. Configure the config.json file
Edit the config.json file to set up the following parameters:

* **port**: Port for the web server.
* **macAddress**: The MAC address of the device to be turned on.
* **ipAddress**: The IP address of the device in the local network.
* **secret**: Secret key for access.

### 3. Copy folders to Keenetic Router
Copy the **WOL-Keenetic** folder and the **etc** directory to the Keenetic Entware path **/opt**.

### 4. Install Node.js on Keenetic via SSH
Connect to your Keenetic router via SSH and install Node.js:

```bash
opkg install node
```

### 5. Set the script as executable
Make the script executable using the following command:
```bash
chmod +x /opt/etc/init.d/S55wol
```

### 6. Start the script
Start the script using the init.d service:
```bash
/opt/etc/init.d/S55wol start
```

### 7. Verify successful startup
If the script starts successfully, you should see the following message:
```bash
Process started successfully with PID №
```

If any errors occur, refer to the logs for debugging:
```bash
cat /opt/WOL-Keenetic/log.txt
```

### 8. Configure KeenDNS on the Keenetic Router
Set up a domain name on the port from config.json and with access to the router.

Use:  
To start the device: [http://your.domain.name/launch/secret-key](http://your.domain.name/launch/secret-key)  
To check the device status(see [Note](https://github.com/XEGARE/WOL-Keenetic?tab=readme-ov-file#note)): [http://your.domain.name/status/secret-key](http://your.domain.name/status/secret-key)

## Note
### For Windows Users
For the proper functioning of the utility on Windows, it is necessary to allow the **ICMPv4** protocol in the firewall settings. This is required for operations involving network device availability checks (such as pinging).
