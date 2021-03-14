import express from 'express'
import dotenv from 'dotenv'
import crypto from 'crypto'
import request from 'request-promise'
import querystring from 'querystring'
import nonce from 'nonce'
import cookie from 'cookie'
import axios from 'axios'

dotenv.config()

const apiKey = process.env.SHOPIFY_API_KEY
const apiSecret = process.env.SHOPIFY_API_SECRET
const scope = 'write_products'
const forwardingAddress = 'https://e7f8a58f53af.ngrok.io'

const app = express()


app.get('/shopify', (req, res) => {
    const shop = req.query.shop

    if (shop) {
        const state = nonce()()
        const redirectUri = forwardingAddress + '/shopify/callback'
        const installUrl = 'https://' + shop + '/admin/oauth/authorize?client_id=' + apiKey +
            '&scope=' + scope +
            '&state=' + state +
            '&redirect_uri=' + redirectUri;

        res.cookie('state', state)
        res.redirect(installUrl)
    } else {
        return res.status(400).send('missing shop. please add ? shop as query parameter to the address')
    }
})


app.get('/shopify/callback', (req, res) => {
    const { shop, hmac, code, state } = req.query
    const stateCookie = cookie.parse(req.headers.cookie).state;

    if (state !== stateCookie) {
        return res.status(403).send('Request origin cannot be verified')

    }

    if (shop && hmac && code) {
        const map = Object.assign({}, req.query)
        delete map['hmac']

        const message = querystring.stringify(map)

        const generatedHash = crypto.createHmac('sha256', apiSecret).update(message).digest('hex')

        if (generatedHash !== hmac) {
            return res.status(400).send('Hmac validation failed!')
        }
        const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token'
        const accessTokenPayload = {
            client_id: apiKey,
            client_secret: apiSecret,
            code
        }
        request.post(accessTokenRequestUrl, { json: accessTokenPayload })
            .then((accessTokenResponse) => {
                const accessToken = accessTokenResponse.access_token;
                const apiRequestUrl = 'https://' + shop + '/admin/shop.json'
                const apiRequestHeaders = {
                    'X-Shopify-Access-Token': accessToken
                }
                request.get(apiRequestUrl, { headers: apiRequestHeaders })
                    .then(apiResponse => {
                        res.end(apiResponse)
                    }).catch(err => console.log(err.message));

            }).catch(err => console.log(err.message));
    } else {
        res.status(400).send('required parameters');
    }
})


app.listen(3000, () => console.log('server started on port 3000'))




