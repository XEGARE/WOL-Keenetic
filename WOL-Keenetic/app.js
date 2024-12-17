import express from 'express'
import wol from 'wakeonlan'
import dateFormat from 'dateformat'
import config from './config.json' assert { type: 'json' }

function log(text) {
    console.log('[' + dateFormat(new Date(), "dd.mm.yyyy HH:MM:ss") + ']: ' + text)
}

const app = express()
const port = config.port

app.get('/launch', (req, res) => {
    wol(config.macAddress, { address: config.ipAddress })
        .then(() => {
            log('WOL sent!')
            res.json({ status: 'ok' })
        })
        .catch(err => {
            log('Error sending WOL: ' + err.message)
        })
})

app.listen(port, () => log('Server has been started on port ' + port + '...'))