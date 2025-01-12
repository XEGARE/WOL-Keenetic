import express from 'express'
import wol from 'wakeonlan'
import dateFormat from 'dateformat'
import config from './config.json' assert { type: 'json' }
import ping from 'ping'

function log(text) {
    console.log('[' + dateFormat(new Date(), "dd.mm.yyyy HH:MM:ss") + ']: ' + text)
}

const app = express()

app.get('/launch/:secret', (req, res) => {
    const secretKey = req.params.secret

    if (!secretKey) {
        return res.status(400).json({ status: 'error', message: 'Secret Key is required!' })
    }

    if (secretKey !== config.secret) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized access: Secret Key does not match!' })
    }

    wol(config.macAddress, { address: config.ipAddress })
        .then(() => {
            log('WOL sent!')
            res.json({ status: 'ok' })
        })
        .catch(err => {
            log('Error sending WOL: ' + err.message)
            res.status(500).json({ status: 'error', message: err.message })
        })
})

app.get('/status/:secret', async (req, res) => {
    const secretKey = req.params.secret

    if (!secretKey) {
        return res.status(400).json({ status: 'error', message: 'Secret Key is required!' })
    }

    if (secretKey !== config.secret) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized access: Secret Key does not match!' })
    }

    try {
        log(`Сhecking device status ${config.ipAddress}`)
        const result = await ping.promise.probe(config.ipAddress)
        if (result.alive) {
            log('Device is online')
            res.json({ value: true })
        } else {
            log('Device is offline')
            res.json({ value: false })
        }
    } catch (err) {
        log('Error pinging IP: ' + err.message)
        res.status(500).json({ value: false, status: 'error', message: err.message })
    }
})

app.listen(config.port, () => log(`Server has been started on port ${config.port}...`))