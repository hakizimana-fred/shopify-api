import express from 'express'
import dotenv from 'dotenv'
import crypto from 'crypto'
import nonce from 'nonce'
import request from 'request'
import querystring from 'querystring'

const apiKey = process.env.SHOPIFY_API_KEY
const apiSecret = process.env.SHOPIFY_API_SECRET
const scopes = 'write_products'
const forwardingAddress = 'https://f09b780500b6.ngrok.io'

const app = express()


app.get('/', (req, res) => {
    res.send('hello')
})

app.listen(3000, () => console.log('server started'))




