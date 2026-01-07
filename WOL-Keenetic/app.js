import dateFormat from "dateformat"
import express from "express"
import ping from "ping"
import wol from "wakeonlan"
import config from "./config.json" assert { type: "json" }

function log(text) {
    console.log(
        "[" + dateFormat(new Date(), "dd.mm.yyyy HH:MM:ss") + "]: " + text
    )
}

const app = express()

app.get("/launch/:secret", (req, res) => {
    const secretKey = req.params.secret

    if (!secretKey) {
        return res
            .status(400)
            .json({ status: "error", message: "Secret Key is required!" })
    }

    if (secretKey !== config.secret) {
        return res.status(403).json({
            status: "error",
            message: "Unauthorized access: Secret Key does not match!",
        })
    }

    wol(config.macAddress, { address: config.ipAddress })
        .then(() => {
            log("WOL sent!")
            res.json({ status: "ok" })
        })
        .catch((err) => {
            log("Error sending WOL: " + err.message)
            res.status(500).json({ status: "error", message: err.message })
        })
})

app.get("/launch/:secret/:mac/:address", (req, res) => {
    const secretKey = req.params.secret
    const macAddress = req.params.mac
    const ipAddress = req.params.address

    if (!secretKey) {
        return res
            .status(400)
            .json({ status: "error", message: "Secret Key is required!" })
    }

    if (secretKey !== config.secret) {
        return res.status(403).json({
            status: "error",
            message: "Unauthorized access: Secret Key does not match!",
        })
    }

    wol(macAddress, { address: ipAddress })
        .then(() => {
            log("WOL sent!")
            res.json({ status: "ok" })
        })
        .catch((err) => {
            log("Error sending WOL: " + err.message)
            res.status(500).json({ status: "error", message: err.message })
        })
})

app.get("/status/:secret", async (req, res) => {
    const secretKey = req.params.secret

    if (!secretKey) {
        return res
            .status(400)
            .json({ status: "error", message: "Secret Key is required!" })
    }

    if (secretKey !== config.secret) {
        return res.status(403).json({
            status: "error",
            message: "Unauthorized access: Secret Key does not match!",
        })
    }

    try {
        log(`Сhecking device status ${config.ipAddress}`)
        const result = await ping.promise.probe(config.ipAddress)
        if (result.alive) {
            log("Device is online")
            res.json({ value: true })
        } else {
            log("Device is offline")
            res.json({ value: false })
        }
    } catch (err) {
        log("Error pinging IP: " + err.message)
        res.status(500).json({
            value: false,
            status: "error",
            message: err.message,
        })
    }
})

app.get("/status/:secret/:address", async (req, res) => {
    const secretKey = req.params.secret
    const ipAddress = req.params.address

    if (!secretKey) {
        return res
            .status(400)
            .json({ status: "error", message: "Secret Key is required!" })
    }

    if (secretKey !== config.secret) {
        return res.status(403).json({
            status: "error",
            message: "Unauthorized access: Secret Key does not match!",
        })
    }

    try {
        log(`Сhecking device status ${ipAddress}`)
        const result = await ping.promise.probe(ipAddress)
        if (result.alive) {
            log("Device is online")
            res.json({ value: true })
        } else {
            log("Device is offline")
            res.json({ value: false })
        }
    } catch (err) {
        log("Error pinging IP: " + err.message)
        res.status(500).json({
            value: false,
            status: "error",
            message: err.message,
        })
    }
})

app.listen(config.port, () =>
    log(`Server has been started on port ${config.port}...`)
)
