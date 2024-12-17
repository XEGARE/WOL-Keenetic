# Node.js Script Setup for Sending Magic Packets via Keenetic Router

This script, written in **Node.js**, sends a **magic packet** to a target device to turn it on via a Keenetic router.

## Installation Steps

### 1. Clone the repository and install Dependencies
On your main system, clone the repository and install the required dependencies using npm:

```bash
git clone https://github.com/XEGARE/WOL-Keenetic.git
cd WOL-Keenetic
npm install
```

### 2. Configure the config.json file
Edit the config.json file to set up the following parameters:

* **port**: Port for the web server.
* **macAddress**: The MAC address of the device to be turned on.
* **ipAddress**: The IP address of the device in the local network.

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
