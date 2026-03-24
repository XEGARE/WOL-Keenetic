import dateFormat from "dateformat"
import Fastify from "fastify"
import ping from "ping"
import wol from "wakeonlan"
import config from "./config.json" assert { type: "json" }

function log(text) {
    console.log(
        "[" + dateFormat(new Date(), "dd.mm.yyyy HH:MM:ss") + "]: " + text,
    )
}

const fastify = Fastify({
    logger: false,
})

async function checkSecret(request, reply) {
    const { secret } = request.params ?? {}

    if (!secret) {
        return reply
            .code(400)
            .send({ status: "error", message: "Secret Key is required!" })
    }

    if (secret !== config.secret) {
        return reply.code(403).send({
            status: "error",
            message: "Unauthorized access: Secret Key does not match!",
        })
    }
}

fastify.get(
    "/launch/:secret",
    { preHandler: checkSecret },
    async (request, reply) => {
        const mac = request.query?.mac ?? config.macAddress
        const address = request.query?.address ?? config.ipAddress

        try {
            await wol(mac, { address })
            log(`WOL sent for ${address} (${mac})`)
            return reply.send({ status: "ok" })
        } catch (err) {
            log(`Error sending WOL for ${address} (${mac}):\n${err.message}`)
            return reply
                .code(500)
                .send({ status: "error", message: err.message })
        }
    },
)

fastify.get(
    "/status/:secret",
    { preHandler: checkSecret },
    async (request, reply) => {
        const address = request.query?.address ?? config.ipAddress
        try {
            log(`Status check for ${address}:`)
            const result = await ping.promise.probe(address)
            if (result.alive) {
                log("Device is online")
                return reply.send({ value: true })
            } else {
                log("Device is offline")
                return reply.send({ value: false })
            }
        } catch (err) {
            log(`Error pinging IP (${address}):\n${err.message}`)
            return reply.code(500).send({
                value: false,
                status: "error",
                message: err.message,
            })
        }
    },
)

try {
    await fastify.listen({ port: config.port, host: "0.0.0.0" })
    log(`Server has been started on port ${config.port}...`)
} catch (err) {
    log(`Failed to start server: ${err.message}`)
    process.exit(1)
}
